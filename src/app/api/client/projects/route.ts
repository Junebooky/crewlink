import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAuthenticatedContext } from '@/lib/auth/serverAuth';

/**
 * Helper to generate YYYY-MM-DD date range safely without timezone shifts
 */
function getDatesInRange(startStr: string, endStr: string): string[] {
  const dates: string[] = [];
  if (!startStr) return dates;
  if (!endStr || endStr < startStr) return [startStr];

  const [sy, sm, sd] = startStr.split('-').map(Number);
  const [ey, em, ed] = endStr.split('-').map(Number);
  const curr = new Date(Date.UTC(sy, sm - 1, sd));
  const end = new Date(Date.UTC(ey, em - 1, ed));

  while (curr <= end) {
    const y = curr.getUTCFullYear();
    const m = String(curr.getUTCMonth() + 1).padStart(2, '0');
    const d = String(curr.getUTCDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    curr.setUTCDate(curr.getUTCDate() + 1);
  }
  return dates;
}

export async function POST(request: Request) {
  try {
    const { authContext, errorResponse } = await getAuthenticatedContext(request, 'client');
    if (errorResponse) {
      return errorResponse;
    }
    if (!authContext) {
      return NextResponse.json({ message: '다시 로그인해 주세요.' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      category = '전시·컨벤션',
      venueName,
      venueAddress,
      venueDetail,
      roadAddress,
      detailAddress,
      latitude,
      longitude,
      isMultiDay = false,
      startDate,
      endDate,
      eventDate, // fallback from single-date form
      startTime,
      endTime,
      breakMinutes = 60,
      headcount = 8,
      dailyWage, // optional precomputed daily wage
      hourlyRateWon = 15000,
      selectedScopes = [],
      positionSpecs = [],
      dressCode,
      notes,
    } = body;

    const actualStartDate = startDate || eventDate;
    const actualEndDate = isMultiDay ? (endDate || actualStartDate) : actualStartDate;

    if (!title || !actualStartDate || !startTime || !endTime) {
      return NextResponse.json(
        { message: '행사명과 날짜, 시작·종료 시간을 입력해 주세요.' },
        { status: 400 }
      );
    }

    if (actualEndDate < actualStartDate) {
      return NextResponse.json(
        { message: '종료일은 시작일보다 이전일 수 없습니다.' },
        { status: 400 }
      );
    }

    const count = Number(headcount);
    if (!count || count <= 0) {
      return NextResponse.json(
        { message: '필요한 크루 인원을 1명 이상 지정해 주세요.' },
        { status: 400 }
      );
    }

    // 1. Calculate pure working hours reflecting break time
    const startParts = startTime.split(':').map(Number);
    const endParts = endTime.split(':').map(Number);
    const startMins = (startParts[0] || 0) * 60 + (startParts[1] || 0);
    const endMins = (endParts[0] || 0) * 60 + (endParts[1] || 0);
    const totalMinutes = endMins - startMins;

    if (totalMinutes <= 0) {
      return NextResponse.json(
        { message: '종료 시간은 시작 시간보다 늦어야 해요.' },
        { status: 400 }
      );
    }

    const netWorkMinutes = Math.max(60, totalMinutes - Number(breakMinutes));
    const netWorkHours = Number((netWorkMinutes / 60).toFixed(1));
    const rateWon = Number(hourlyRateWon) || 15000;
    const calculatedDailyWage = dailyWage ? Number(dailyWage) : Math.floor(netWorkHours * rateWon);

    // Generate date array
    const dateList = isMultiDay ? getDatesInRange(actualStartDate, actualEndDate) : [actualStartDate];
    const totalDays = Math.max(1, dateList.length);

    const supabase = createAdminClient();

    // 2. Resolve client organization
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('person_id', authContext.personId)
      .maybeSingle();

    let organizationId = member?.organization_id || null;
    if (!organizationId) {
      if (authContext.roles.includes('ops') || authContext.roles.includes('admin')) {
        const { data: defaultOrg } = await supabase
          .from('organizations')
          .select('id')
          .eq('status', 'active')
          .limit(1)
          .maybeSingle();
        organizationId = defaultOrg?.id || null;
      }
    }

    if (!organizationId) {
      return NextResponse.json(
        { message: '등록된 주최사 조직 정보를 찾을 수 없어요. 주최사 등록 후 다시 시도해 주세요.' },
        { status: 403 }
      );
    }

    let createdProjectId: string | null = null;
    const createdShiftIds: string[] = [];
    let createdQuoteId: string | null = null;

    try {
      // 3. Insert Project with start_date & end_date
      const { data: project, error: projError } = await supabase
        .from('projects')
        .insert({
          organization_id: organizationId,
          title,
          venue_name: venueName || roadAddress || '장소 확인 필요',
          road_address: venueAddress || roadAddress || '서울 강남구 영동대로 513',
          detail_address: venueDetail || detailAddress || '',
          latitude: latitude ? Number(latitude) : null,
          longitude: longitude ? Number(longitude) : null,
          status: 'published',
          start_date: actualStartDate,
          end_date: actualEndDate,
          sow_spec: {
            category,
            isMultiDay,
            startDate: actualStartDate,
            endDate: actualEndDate,
            dates: dateList,
            totalDays,
            scopes: selectedScopes,
            netWorkHours,
            breakMinutes,
            positionSpecs,
            dressCode: dressCode || '올블랙 정장·슬랙스',
            notes: notes || '',
          },
        })
        .select('id')
        .single();

      if (projError || !project) {
        console.error('[POST /api/client/projects] projError:', projError);
        throw new Error(projError?.message || '행사를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.');
      }

      createdProjectId = project.id;

      // 4. Atomically insert Shifts & Shift Slots for each date in dateList
      for (let i = 0; i < dateList.length; i++) {
        const currentDate = dateList[i];
        const startDateTime = new Date(`${currentDate}T${startTime}:00`);
        const endDateTime = new Date(`${currentDate}T${endTime}:00`);
        const checkinOpensAt = new Date(startDateTime.getTime() - 60 * 60 * 1000).toISOString();
        const checkinClosesAt = new Date(startDateTime.getTime() + 60 * 60 * 1000).toISOString();

        const shiftName = totalDays > 1
          ? `${title} · ${i + 1}일차 (${currentDate})`
          : `${title} · 근무 일정`;

        const { data: shift, error: shiftError } = await supabase
          .from('shifts')
          .insert({
            project_id: project.id,
            shift_name: shiftName,
            required_headcount: count,
            date: currentDate,
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
            checkin_opens_at: checkinOpensAt,
            checkin_closes_at: checkinClosesAt,
            hourly_rate_won: rateWon,
            daily_wage: calculatedDailyWage,
          })
          .select('id')
          .single();

        if (shiftError || !shift) {
          console.error('[POST /api/client/projects] shiftError on date', currentDate, shiftError);
          throw new Error(shiftError?.message || `${currentDate} 일자의 근무 일정을 저장하지 못했습니다.`);
        }

        createdShiftIds.push(shift.id);

        // Create shift slots for this shift
        const slotsToInsert = Array.from({ length: count }, (_, slotIdx) => ({
          shift_id: shift.id,
          slot_number: slotIdx + 1,
          position_code: `POS-${String(slotIdx + 1).padStart(2, '0')}`,
          status: 'open',
        }));

        const { error: slotsError } = await supabase.from('shift_slots').insert(slotsToInsert);
        if (slotsError) {
          console.error('[POST /api/client/projects] slotsError on shift', shift.id, slotsError);
          throw new Error(slotsError.message || `${currentDate} 일자의 근무 슬롯을 생성하지 못했습니다.`);
        }
      }

      // 5. Calculate Quote total reflecting totalDays: dailyWage * totalDays * count
      const totalWage = calculatedDailyWage * totalDays * count;
      const platformFeeWon = Math.floor(totalWage * 0.15); // 15% platform fee
      const subtotalWon = totalWage + platformFeeWon;
      const vatWon = Math.floor(subtotalWon * 0.10); // 10% VAT
      const totalAmountWon = subtotalWon + vatWon;

      const quoteNumber = `Q-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          project_id: project.id,
          quote_number: quoteNumber,
          subtotal_won: subtotalWon,
          platform_fee_won: platformFeeWon,
          vat_won: vatWon,
          total_amount_won: totalAmountWon,
          status: 'issued',
        })
        .select('id, quote_number')
        .single();

      if (quoteError || !quote) {
        console.error('[POST /api/client/projects] quoteError:', quoteError);
        throw new Error(quoteError?.message || '견적을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.');
      }

      createdQuoteId = quote.id;

      // 6. Insert Quote Items
      const itemName = totalDays > 1
        ? `크루 보수 (하루 ${count}명 × ${totalDays}일 = 연인원 ${count * totalDays}명)`
        : `크루 보수 (${count}명 × ${netWorkHours}시간)`;

      const { error: quoteItemsError } = await supabase.from('quote_items').insert([
        {
          quote_id: quote.id,
          item_name: itemName,
          quantity: count * totalDays,
          unit_price_won: calculatedDailyWage,
          amount_won: totalWage,
        },
        {
          quote_id: quote.id,
          item_name: '운영료 (15%)',
          quantity: 1,
          unit_price_won: platformFeeWon,
          amount_won: platformFeeWon,
        },
      ]);

      if (quoteItemsError) {
        console.error('[POST /api/client/projects] quoteItemsError:', quoteItemsError);
        throw new Error(quoteItemsError.message || '견적 항목을 저장하지 못했어요.');
      }

      return NextResponse.json({
        success: true,
        projectId: project.id,
        shiftIds: createdShiftIds,
        shiftId: createdShiftIds[0],
        totalDays,
        quoteId: quote.id,
        quoteNumber: quote.quote_number,
        netWorkHours,
        totalAmountWon,
        message: '운영 요청을 성공적으로 등록했어요.',
      });
    } catch (atomicError) {
      // Reverse hierarchical compensation rollback to prevent orphan records
      console.warn('[POST /api/client/projects] Rolling back intermediate entities due to error:', atomicError);

      if (createdQuoteId) {
        try {
          await supabase.from('quote_items').delete().eq('quote_id', createdQuoteId);
          await supabase.from('quotes').delete().eq('id', createdQuoteId);
        } catch (rollbackErr) {
          console.error('[Rollback Failure: Quotes]', rollbackErr);
        }
      }

      if (createdShiftIds.length > 0) {
        try {
          for (const sId of createdShiftIds) {
            await supabase.from('shift_slots').delete().eq('shift_id', sId);
            await supabase.from('shifts').delete().eq('id', sId);
          }
        } catch (rollbackErr) {
          console.error('[Rollback Failure: Shifts]', rollbackErr);
        }
      }

      if (createdProjectId) {
        try {
          await supabase.from('projects').delete().eq('id', createdProjectId);
        } catch (rollbackErr) {
          console.error('[Rollback Failure: Projects]', rollbackErr);
        }
      }

      throw atomicError;
    }
  } catch (err: unknown) {
    console.error('[POST /api/client/projects] Error caught:', err);
    return NextResponse.json({ message: (err as Error).message }, { status: 400 });
  }
}
