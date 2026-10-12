/* eslint-disable @typescript-eslint/no-explicit-any */
export interface KakaoPlaceItem {
  id: string;
  place_name: string;
  category_name?: string;
  category_group_code?: string;
  category_group_name?: string;
  phone?: string;
  address_name: string;
  road_address_name: string;
  x: string; // Longitude
  y: string; // Latitude
  place_url?: string;
  distance?: string;
}

export interface KakaoLatLng {
  getLat(): number;
  getLng(): number;
}

export interface KakaoLatLngBounds {
  extend(latlng: KakaoLatLng): void;
  getSouthWest(): KakaoLatLng;
  getNorthEast(): KakaoLatLng;
  isEmpty(): boolean;
}

export interface KakaoMap {
  setCenter(latlng: KakaoLatLng): void;
  getCenter(): KakaoLatLng;
  setLevel(level: number, options?: { animate?: boolean }): void;
  getLevel(): number;
  panTo(latlng: KakaoLatLng): void;
  getBounds(): KakaoLatLngBounds;
  setBounds(bounds: KakaoLatLngBounds): void;
  relayout(): void;
  addControl(control: any, position: any): void;
}

export interface KakaoMarker {
  setMap(map: KakaoMap | null): void;
  getPosition(): KakaoLatLng;
  setPosition(latlng: KakaoLatLng): void;
  setVisible(visible: boolean): void;
  setZIndex(zIndex: number): void;
}

export interface KakaoCustomOverlay {
  setMap(map: KakaoMap | null): void;
  getPosition(): KakaoLatLng;
  setPosition(latlng: KakaoLatLng): void;
  setContent(content: HTMLElement | string): void;
  getContent(): HTMLElement | string;
  setVisible(visible: boolean): void;
  setZIndex(zIndex: number): void;
}

declare global {
  interface Window {
    kakao: {
      maps: {
        load(callback: () => void): void;
        LatLng: new (lat: number, lng: number) => KakaoLatLng;
        LatLngBounds: new () => KakaoLatLngBounds;
        Map: new (
          container: HTMLElement,
          options: {
            center: KakaoLatLng;
            level: number;
          }
        ) => KakaoMap;
        Marker: new (options: {
          map?: KakaoMap;
          position: KakaoLatLng;
          title?: string;
          image?: any;
          clickable?: boolean;
          zIndex?: number;
        }) => KakaoMarker;
        CustomOverlay: new (options: {
          map?: KakaoMap;
          position: KakaoLatLng;
          content: HTMLElement | string;
          clickable?: boolean;
          xAnchor?: number;
          yAnchor?: number;
          zIndex?: number;
        }) => KakaoCustomOverlay;
        event: {
          addListener(target: any, type: string, handler: (...args: any[]) => void): void;
          removeListener(target: any, type: string, handler: (...args: any[]) => void): void;
        };
        services: {
          Places: new () => {
            keywordSearch(
              keyword: string,
              callback: (
                result: KakaoPlaceItem[],
                status: string,
                pagination: any
              ) => void,
              options?: {
                location?: KakaoLatLng;
                radius?: number;
                bounds?: KakaoLatLngBounds;
                page?: number;
                size?: number;
              }
            ): void;
          };
          Status: {
            OK: string;
            ZERO_RESULT: string;
            ERROR: string;
          };
          Geocoder: new () => any;
        };
      };
    };
  }
}

export {};
