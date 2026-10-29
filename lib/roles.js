// Where each role lands after sign-in, and the URL prefix it is allowed into.
export const ROLE_HOME = {
  admin: "/admin/dashboard",
  doctor: "/doctor/dashboard",
  patient: "/patient/prescriptions",
  receptionist: "/receptionist/appointments",
};

export const ROLE_PREFIX = {
  admin: "/admin",
  doctor: "/doctor",
  patient: "/patient",
  receptionist: "/receptionist",
};
