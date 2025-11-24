import { apiRequest, type ApiResponse, type Booking } from '@/lib/api';

export interface CreateBookingPayload {
  chefId: number;
  eventDate: string;
  eventTime: string;
  guestCount: number;
  durationHours?: number;
  serviceAddress: string;
  serviceCity: string;
  serviceState: string;
  serviceZipCode: string;
  serviceType?: string;
  specialRequests?: string;
  dietaryRequirements?: string[];
  menuItems?: Array<{ menu_item_id: number; quantity: number; special_instructions?: string }>;
}

const BOOKING_ENDPOINT = '/bookings/create/';

function toApiPayload(payload: CreateBookingPayload) {
  // Combine date and time into ISO datetime string
  const bookingDate = new Date(`${payload.eventDate}T${payload.eventTime}`).toISOString();
  
  return {
    chef_id: payload.chefId,
    booking_date: bookingDate,
    number_of_guests: payload.guestCount,
    duration_hours: payload.durationHours || 2,
    service_type: payload.serviceType || 'personal_meal',
    service_address: payload.serviceAddress,
    service_city: payload.serviceCity,
    service_state: payload.serviceState,
    service_zip_code: payload.serviceZipCode,
    special_requests: payload.specialRequests || '',
    dietary_requirements: payload.dietaryRequirements || [],
    menu_items: payload.menuItems || [],
  };
}

export async function getBookings(): Promise<ApiResponse<Booking[]>> {
  return apiRequest<Booking[]>({
    url: '/bookings/',
    method: 'GET',
  }, true);
}

export async function createBooking(payload: CreateBookingPayload): Promise<Booking> {
  const response = await apiRequest<Booking>({
    url: BOOKING_ENDPOINT,
    method: 'POST',
    data: toApiPayload(payload),
  }, true);

  if (response.error) {
    throw new Error(response.error);
  }

  if (!response.data) {
    throw new Error('No booking data returned from server');
  }

  return response.data;
}

export const bookingsApi = {
  getBookings,
  createBooking,
};
