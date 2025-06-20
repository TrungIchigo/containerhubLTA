CREATE TYPE "organization_type" AS ENUM ('TRUCKING_COMPANY', 'SHIPPING_LINE');
CREATE TYPE "user_role" AS ENUM ('DISPATCHER', 'CARRIER_ADMIN');
CREATE TYPE "request_status" AS ENUM ('PENDING', 'APPROVED', 'DECLINED');
CREATE TYPE "asset_status" AS ENUM ('AVAILABLE', 'AWAITING_APPROVAL', 'CONFIRMED');

CREATE TABLE "organizations" (
  "id" uuid PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "name" text NOT NULL,
  "type" organization_type NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE "profiles" (
  "id" uuid PRIMARY KEY,
  "full_name" text,
  "organization_id" uuid,
  "role" user_role NOT NULL,
  "updated_at" timestamptz DEFAULT (now())
);

CREATE TABLE "import_containers" (
  "id" uuid PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "container_number" text NOT NULL,
  "container_type" text NOT NULL,
  "drop_off_location" text NOT NULL,
  "available_from_datetime" timestamptz NOT NULL,
  "trucking_company_org_id" uuid NOT NULL,
  "shipping_line_org_id" uuid NOT NULL,
  "status" asset_status NOT NULL DEFAULT 'AVAILABLE',
  "created_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE "export_bookings" (
  "id" uuid PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "booking_number" text NOT NULL,
  "required_container_type" text NOT NULL,
  "pick_up_location" text NOT NULL,
  "needed_by_datetime" timestamptz NOT NULL,
  "trucking_company_org_id" uuid NOT NULL,
  "status" asset_status NOT NULL DEFAULT 'AVAILABLE',
  "created_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE "street_turn_requests" (
  "id" uuid PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "import_container_id" uuid NOT NULL,
  "export_booking_id" uuid NOT NULL,
  "requesting_org_id" uuid NOT NULL,
  "approving_org_id" uuid NOT NULL,
  "status" request_status NOT NULL DEFAULT 'PENDING',
  "estimated_cost_saving" numeric,
  "estimated_co2_saving_kg" numeric,
  "created_at" timestamptz NOT NULL DEFAULT (now())
);

ALTER TABLE "profiles" ADD FOREIGN KEY ("id") REFERENCES "auth"."users" ("id");
ALTER TABLE "profiles" ADD FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id");
ALTER TABLE "import_containers" ADD FOREIGN KEY ("trucking_company_org_id") REFERENCES "organizations" ("id");
ALTER TABLE "import_containers" ADD FOREIGN KEY ("shipping_line_org_id") REFERENCES "organizations" ("id");
ALTER TABLE "export_bookings" ADD FOREIGN KEY ("trucking_company_org_id") REFERENCES "organizations" ("id");
ALTER TABLE "street_turn_requests" ADD FOREIGN KEY ("import_container_id") REFERENCES "import_containers" ("id");
ALTER TABLE "street_turn_requests" ADD FOREIGN KEY ("export_booking_id") REFERENCES "export_bookings" ("id");
ALTER TABLE "street_turn_requests" ADD FOREIGN KEY ("requesting_org_id") REFERENCES "organizations" ("id");
ALTER TABLE "street_turn_requests" ADD FOREIGN KEY ("approving_org_id") REFERENCES "organizations" ("id");