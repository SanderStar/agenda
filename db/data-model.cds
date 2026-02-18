namespace agenda;

entity Person {
  key ID      : UUID;
  name        : String(100);
  email       : String(100);
}

entity Location {
  key ID      : UUID;
  name        : String(100);
  address     : String(200);
}

entity Event {
  key ID        : UUID;
  title         : String(100);
  date          : Date;
  location_ID   : Association to Location;
  person_ID     : Association to Person;
  group_ID      : Association to Group not null;
}

entity Group {
  key ID        : String(36);
  name          : String(100);
  description   : String(200);
}
