using { agenda as my } from '../db/data-model';

service AgendaService {
  entity Persons   as projection on my.Person;
  entity Locations as projection on my.Location;
  entity Events    as projection on my.Event;
  entity Groups    as projection on my.Group;
}
