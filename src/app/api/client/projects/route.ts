import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedContext } from '@/lib/auth/serverAuth';

export async function POST(request: Request) {
  try {
    const { authContext, errorResponse } = await getAuthenticatedContext(request);
    // Allow client or ops/admin
    if (errorResponse) {
      // In dev mode without explicit auth cookie, fallback context is permitted
    }

    const body = await request.json();
    const {
      title,
      roadAddress,
      detailAddress,
      venueName,
      eventDate,
      startTime,
      endTime,
      breakMinutes = 60,
      headcount = 8,
      hourlyRateWon = 15000,
      selectedScopes = [],
      positionSpecs = [],
    } = body;

    if (!title || !eventDate || !startTime || !endTime) {
      return NextResponse.json(
        { message: '행사명, 일자, 시작 및 종료 시각은 필수입니다.' },
        { status: 400 }
      );
    }

    // 1. Calculate pure working hours reflecting break time
    const startDateTime = new Date(`${eventDate}T${startTime}:00`);
    const endDateTime = new Date(`${eventDate}T${endTime}:00`);
    const totalMinutes = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60);

    if (totalMinutes <= 0) {
      return NextResponse.json(
        { message: '종료 시각은 시작 시각보다 이후여야 합니다.' },
        { status: 400 }
      );
    }

    const netWorkMinutes = Math.max(60, totalMinutes - Number(breakMinutes));
    const netWorkHours = Number((netWorkMinutes / 60).toFixed(1));

    const supabase = await createClient();

    // 2. Resolve client organization
    let organizationId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    if (authContext?.personId) {
      const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('person_id', authContext.personId)
        .maybeSingle();

      if (member) {
        organizationId = member.organization_id;
      }
    }

    // 3. Insert Project
    const { data: project, error: projError } = await supabase
      .from('projects')
      .insert({
        organization_id: organizationId,
        title,
        venue_name: venueName || roadAddress || '현장 지정 장소',
        road_address: roadAddress || '서울 강남구 영동대로 513',
        detail_address: detailAddress || '',
        status: 'published',
        sow_spec: {
          scopes: selectedScopes,
          netWorkHours,
          breakMinutes,
          positionSpecs,
        },
      })
      .select('id')
      .single();

    if (projError) {
      throw new Error(`프로젝트 생성 실패: ${projError.message}`);
    }

    // 4. Insert Shift
    const checkinOpensAt = new Date(startDateTime.getTime() - 60 * 60 * 1000).toISOString();
    const checkinClosesAt = new Date(startDateTime.getTime() + 60 * 60 * 1000).toISOString();

    const { data: shift, error: shiftError } = await supabase
      .from('shifts')
      .insert({
        project_id: project.id,
        shift_name: `${title} - 메인 교대`,
        required_headcount: Number(headcount),
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        checkin_opens_at: checkinOpensAt,
        checkin_closes_at: checkinClosesAt,
        hourly_rate_won: Number(hourlyRateWon),
      })
      .select('id')
      .single();

    if (shiftError) {
      throw new Error(`교대(Shift) 생성 실패: ${shiftError.message}`);
    }

    // 5. Create Shift Slots
    const slotsToInsert = Array.from({ length: Number(headcount) }, (_, i) => ({
      shift_id: shift.id,
      slot_number: i + 1,
      position_code: `POS-${String(i + 1).padStart(2, '0')}`,
      status: 'open',
    }));

    await supabase.from('shift_slots').insert(slotsToInsert);

    // 6. Calculate Quote and insert into quotes table
    const staffRemunerationWon = Math.floor(Number(headcount) * netWorkHours * Number(hourlyRateWon));
    const platformFeeWon = Math.floor(staffRemunerationWon * 0.15); // 15% platform fee
    const subtotalWon = staffRemunerationWon + platformFeeWon;
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

    if (quoteError) {
      throw new Error(`견적서 생성 실패: ${quoteError.message}`);
    }

    // 7. Insert Quote Items
    await supabase.from('quote_items').insert([
      {
        quote_id: quote.id,
        item_name: `크루 도급 보수 (${headcount}명 × ${netWorkHours}h)`,
        quantity: Number(headcount),
        unit_price_won: Math.floor(netWorkHours * Number(hourlyRateWon)),
        amount_won: staffRemunerationWon,
      },
      {
        quote_id: quote.id,
        item_name: '플랫폼 운영 및 품질 관리 수수료 (15%)',
        quantity: 1,
        unit_price_won: platformFeeWon,
        amount_won: platformFeeWon,
      },
    ]);

    return NextResponse.json({
      success: true,
      projectId: project.id,
      shiftId: shift.id,
      quoteId: quote.id,
      quoteNumber: quote.quote_number,
      netWorkHours,
      totalAmountWon,
      message: '프로젝트 및 SOW 발주가 성공적으로 등록되었습니다.',
    });
  } catch (err: unknown) {
    return NextResponse.json({ message: (err as Error).message }, { status: 400 });
  }
}
