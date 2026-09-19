export type Locale = "fr" | "en";

export interface HotelImage {
  id: number;
  image_url: string;
  sort_order: number;
}
    last_name: string;
    email: string;
  };
}

export interface Hotel {
  id: number;
  uuid?: string;
  slug: string;
  name: string;
  stars?: number | null;
  legal_name?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  timezone: string;
  currency: string;
  tax_rate: number;
  check_in_time?: string | null;
  check_out_time?: string | null;
  logo_path?: string | null;
  logo_url?: string | null;
  images?: HotelImage[];
  status?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  locale: Locale;
  is_active: boolean;
  hotel_id: number | null;
  hotel?: Hotel | null;
  roles?: { id: number; name: string }[];
  permissions?: string[];
}

export interface RoomType {
  id: number;
  name: string;
  description?: string | null;
  base_capacity: number;
  max_capacity: number;
  base_rate_cents: number;
  nightly_rate_cents?: number | null;
  is_active: boolean;
  amenities_count?: number;
}

export type RoomStatus =
  | "available"
  | "occupied"
  | "dirty"
  | "out_of_order"
  | "maintenance";

export interface Room {
  id: number;
  room_number: string;
  floor: number;
  room_type_id: number;
  capacity: number;
  daily_rate_cents?: number | null;
  rate_cents?: number;
  status: RoomStatus;
  keycard_code?: string | null;
  notes?: string | null;
  room_type?: { id: number; name: string };
  amenities?: { id: number; name: string; icon?: string }[];
}

export interface Amenity {
  id: number;
  name: string;
  icon?: string | null;
}

export interface Guest {
  id: number;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  nationality?: string | null;
  id_type?: string | null;
  id_number?: string | null;
  date_of_birth?: string | null;
  city?: string | null;
  country?: string | null;
  is_blacklisted: boolean;
  notes?: string | null;
  full_name?: string;
}

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "checked_in"
  | "checked_out"
  | "cancelled"
  | "no_show";

export interface BookingRoomLine {
  id: number;
  room_id: number;
  room?: Room;
  rate_plan_id?: number | null;
  rate_plan?: { id: number; name: string };
  check_in: string;
  check_out: string;
  nights: number;
  nightly_rate_cents: number;
  line_total_cents: number;
  active: boolean;
}

export interface Payment {
  id: number;
  booking_id: number;
  amount_cents: number;
  method: string;
  reference?: string | null;
  status: string;
  paid_at?: string | null;
  received_by?: number | null;
  receiver?: { id: number; name: string; email?: string } | null;
}

export interface Booking {
  id: number;
  booking_number: string;
  guest_id: number;
  status: BookingStatus;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  source?: string | null;
  subtotal_cents: number;
  tax_cents: number;
  discount_cents: number;
  total_cents: number;
  paid_cents: number;
  notes?: string | null;
  nights: number;
  balance_due_cents: number;
  created_by_name?: string | null;
  cancellation_reason?: string | null;
  cancelled_at?: string | null;
  guest?: Guest;
  rooms?: BookingRoomLine[];
  payments?: Payment[];
}

export interface Paginated<T> {
  current_page: number;
  data: T[];
  first_page_url?: string;
  from: number | null;
  last_page: number;
  per_page: number;
  total: number;
}

export interface AvailabilityResult {
  check_in: string;
  check_out: string;
  count: number;
  rooms: Room[];
}

export interface AvailabilityDay {
  date: string;
  total: number;
  occupied: number;
  available: number;
}

export interface RatePlan {
  id: number;
  name: string;
  room_type_id: number;
  room_type?: { id: number; name: string };
  currency: string;
  base_rate_cents: number;
  basis: "daily" | "weekly";
  is_active: boolean;
  days_rules?: Record<string, number>;
  season_rules?: { start: string; end: string; multiplier: number }[];
  week_multiplier?: number;
}

export interface Employee {
  id: number;
  name: string;
  position?: string | null;
  salary_cents: number;
  hire_date?: string | null;
  is_active: boolean;
  notes?: string | null;
  total_paid_cents?: number;
  created_at?: string | null;
}

export interface ExpenseType {
  id: number;
  name: string;
  key?: string | null;
  color?: string | null;
  is_active: boolean;
  expenses_count?: number;
  created_at?: string | null;
}

export interface Expense {
  id: number;
  expense_type_id?: number | null;
  employee_id?: number | null;
  description: string;
  amount_cents: number;
  incurred_on: string;
  paid_on?: string | null;
  status: "pending" | "paid" | "cancelled";
  created_by_name?: string | null;
  notes?: string | null;
  expense_type?: Pick<ExpenseType, "id" | "name" | "color">;
  employee?: Pick<Employee, "id" | "name">;
  created_at?: string | null;
}

export interface ExpenseSummary {
  this_month_cents: number;
  this_year_cents: number;
  total_cents: number;
  pending_count: number;
  this_month_count: number;
}

export interface Kpis {
  from: string;
  to: string;
  nights: number;
  total_rooms: number;
  sold_room_nights: number;
  available_room_nights: number;
  occupancy_percent: number;
  room_revenue_cents: number;
  adr_cents: number;
  revpar_cents: number;
  bookings_count: number;
}

export interface OccupancyDay {
  date: string;
  sold_room_nights: number;
  occupancy_percent: number;
}

export interface RevenueMonth {
  month: string;
  revenue_cents: number;
  room_nights: number;
}

export interface DashboardSummary {
  today_arrivals: number;
  today_departures: number;
  in_house: number;
  open_bookings_total_cents: number;
  current_month_value_cents: number;
  occupancy_next_7_days: OccupancyDay[];
  currency: string;
}

export interface TeamMember {
  id: number;
  name: string;
  email: string;
  locale: string;
  is_active: boolean;
  roles?: string[];
}

export interface AvailableRoom {
  id: number;
  room_number: string;
  room_type?: { id: number; name: string };
  rate_cents: number;
}

export interface HotelSearchResult {
  id: number;
  name: string;
  stars?: number | null;
  slug: string;
  city?: string | null;
  country?: string | null;
  currency: string;
  phone?: string | null;
  email?: string | null;
  logo_url?: string | null;
  images?: HotelImage[];
  available_rooms?: AvailableRoom[];
}

export interface PublicReview {
  id: number;
  author: string;
  rating: number;
  title?: string | null;
  comment: string;
  verified: boolean;
  created_at: string;
}

export interface PublicHotel {
  name: string;
  stars?: number | null;
  city?: string | null;
  country?: string | null;
  currency: string;
  check_in_time?: string;
  check_out_time?: string;
  phone?: string | null;
  email?: string | null;
  logo_url?: string | null;
  images?: HotelImage[];
  rating?: { average: number | null; count: number } | null;
  reviews?: PublicReview[];
  room_types: (RoomType & { features?: string[] | null })[];
}

export type HotelStatus = "pending" | "active" | "suspended" | "rejected" | "trial";

export interface PlatformHotel {
  id: number;
  slug: string;
  name: string;
  stars?: number | null;
  legal_name?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  currency: string;
  timezone: string;
  status: HotelStatus;
  logo_url?: string | null;
  images?: HotelImage[];
  locale?: string | null;
  created_at?: string;
  users_count: number;
  rooms_count: number;
  bookings_count: number;
  owner?: { id: number; name: string; email: string } | null;
}

export interface PlatformUser {
  id: number;
  name: string;
  email: string;
  locale?: string | null;
  is_active: boolean;
  roles: string[];
  created_at?: string | null;
}

export interface PlatformSettings {
  company_name: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  hours: string;
}

export interface PlatformSummary {
  hotels: number;
  users: number;
  pending: number;
  by_status: Record<HotelStatus, number>;
}

export interface GuestLoginResult {
  token: string;
  guest: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
}