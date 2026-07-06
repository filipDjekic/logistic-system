# Logistics system

# Sadržaj

1. [Kratko o projektu](#kratko-o-projektu)
2. [Kako sistem funkcioniše](#kako-sistem-funkcioniše)
3. [Šta aplikacija nudi](#šta-aplikacija-nudi)
4. [Role i model pristupa](#role-i-model-pristupa)
5. [Tech Stack](#tech-stack)
6. [Pokretanje lokalno](#pokretanje-lokalno)
7. [Podešavanje okruženja](#podešavanje-okruženja)
8. [Mapa projekta](#mapa-projekta)
9. [API pregled](#api-pregled)
10. [Kako je zaštićen sistem](#kako-je-zaštićen-sistem)
11. [Testovi](#testovi)


# Kratko o projektu

Logistics System je višekorisnička web aplikacija namenjena upravljanju logističkim procesima unutar kompanije. Sistem objedinjuje upravljanje skladištima, zalihama, transportnim operacijama, voznim parkom, zaposlenima i operativnim zadacima kroz jedinstven informacioni sistem sa kontrolom pristupa zasnovanom na korisničkim ulogama.

Aplikacija omogućava digitalizaciju svakodnevnih logističkih aktivnosti, od prijema i izdavanja robe, preko planiranja i realizacije transporta, do organizacije rada zaposlenih i praćenja poslovnih događaja. Sve funkcionalnosti dostupne su kroz moderan web interfejs, dok backend obezbeđuje REST API, poslovnu logiku i kontrolu pristupa svim resursima.

Sistem podržava više korisničkih uloga sa različitim nivoima ovlašćenja, uključujući administraciju kompanije, upravljanje ljudskim resursima, organizaciju transporta, upravljanje skladištima, kao i operativni rad vozača i skladišnih radnika. Pristup podacima i dozvoljene operacije određene su u skladu sa odgovornostima svake uloge.

Pored osnovnih CRUD operacija nad poslovnim entitetima, sistem podržava praćenje životnog ciklusa ključnih procesa, istoriju aktivnosti, notifikacije, statističke prikaze, naprednu pretragu i filtriranje podataka, kao i uvoz i izvoz podataka radi jednostavnije administracije i analize poslovanja.

Projekat je razvijen kao full-stack aplikacija korišćenjem Spring Boot i React tehnologija, uz primenu savremenih principa razvoja softvera, autentifikacije i autorizacije, validacije podataka i modularne organizacije koda. Funkcionalnosti implementirane u sistemu prate tipične procese poslovanja logističkih kompanija i predstavljaju osnovu za dalje proširenje i prilagođavanje različitim organizacionim potrebama.

# Kako sistem funkcioniše

```
Administrator kompanije registruje kompaniju i podešava osnovne podatke
        │
        ▼
Korisnici se prijavljuju u sistem i dobijaju pristup u skladu sa svojom ulogom
        │
        ▼
Administratori i odgovorni korisnici kreiraju skladišta, vozila, zaposlene i ostale poslovne resurse
        │
        ▼
Formiraju se zalihe robe, organizuju transportne operacije i dodeljuju operativni zadaci
        │
        ▼
Sistem prati promene statusa, evidentira aktivnosti i primenjuje kontrolu pristupa nad svim operacijama
        │
        ▼
Korisnici izvršavaju svoje zadatke u skladu sa dodeljenim ovlašćenjima
        │
        ▼
Dashboard, statistika i istorija aktivnosti pružaju pregled trenutnog stanja i poslovnih procesa
```

Osnovni poslovni model sistema zasniva se na međusobno povezanim logističkim entitetima:

```text
Kompanija
 ├── Korisnici i zaposleni
 │     ├── Uloge i dozvole
 │     └── Radne smene
 │
 ├── Skladišta
 │     ├── Zone
 │     ├── Bin lokacije
 │     ├── Artikli
 │     ├── Zalihe
 │     ├── Kretanje robe
 │     └── Inventure
 │
 ├── Vozni park
 │     ├── Vozila
 │     └── Održavanje
 │
 ├── Transportne operacije
 │     ├── Ruta
 │     ├── Vozač
 │     ├── Vozilo
 │     └── Status transporta
 │
 ├── Operativni zadaci
 │     └── Dodela zaposlenima
 │
 └── Aktivnosti, notifikacije i statistika
```

Svaka poslovna operacija prolazi kroz validaciju korisničkih ovlašćenja i poslovnih pravila pre izvršavanja. Sistem vodi evidenciju promena nad važnim entitetima, omogućava praćenje njihovog životnog ciklusa i obezbeđuje da korisnici mogu pristupati isključivo podacima i funkcionalnostima koje su im dozvoljene njihovom ulogom.

# Šta aplikacija nudi

## Za korisnike

| Funkcionalnost                  | Opis                                                                                       |
| ------------------------------- | ------------------------------------------------------------------------------------------ |
| Autentifikacija i autorizacija  | Prijava korisnika i kontrola pristupa funkcionalnostima na osnovu dodeljene uloge.         |
| Upravljanje kompanijom          | Kreiranje i administracija kompanije, organizacija poslovnih resursa i korisnika.          |
| Upravljanje zaposlenima         | Evidencija zaposlenih, njihovih radnih mesta, smena i pripadajućih informacija.            |
| Upravljanje skladištima         | Kreiranje i administracija skladišta, zona i skladišnih lokacija.                          |
| Upravljanje artiklima           | Evidencija artikala, kategorija i osnovnih podataka o robi.                                |
| Upravljanje zalihama            | Pregled trenutnog stanja zaliha po skladištima, zonama i bin lokacijama.                   |
| Kretanje robe                   | Evidencija prijema, izdavanja, transfera, korekcija i ostalih skladišnih operacija.        |
| Inventar                        | Kreiranje, sprovođenje i pregled inventura sa evidentiranjem rezultata brojanja.           |
| Upravljanje voznim parkom       | Evidencija vozila, njihovih karakteristika, statusa i održavanja.                          |
| Transportne operacije           | Planiranje, realizacija i praćenje transporta između skladišta.                            |
| Operativni zadaci               | Kreiranje, dodela i praćenje izvršavanja zadataka zaposlenih.                              |
| Promene statusa                 | Praćenje životnog ciklusa poslovnih entiteta kroz definisane statuse i dozvoljene prelaze. |
| Dashboard                       | Centralni pregled najvažnijih poslovnih informacija i ključnih pokazatelja sistema.        |
| Statistika                      | Grafički prikaz poslovnih podataka kroz različite izveštaje i grafikone.                   |
| Istorija aktivnosti             | Evidencija izvršenih akcija i promena nad poslovnim entitetima.                            |
| Notifikacije                    | Obaveštenja o važnim događajima i promenama u sistemu.                                     |
| Pretraga i filtriranje          | Brzo pronalaženje podataka pomoću pretrage, filtera i sortiranja.                          |
| Uvoz i izvoz podataka           | Import i eksport podataka radi jednostavnije administracije i razmene informacija.         |
| Responsive korisnički interfejs | Interfejs prilagođen radu na desktop i mobilnim uređajima.                                 |

## Za sistem

* Kontrola pristupa zasnovana na korisničkim ulogama i dozvolama.
* Validacija poslovnih pravila pre izvršavanja svake operacije.
* Evidentiranje istorije aktivnosti nad ključnim poslovnim entitetima.
* Praćenje životnog ciklusa poslovnih procesa kroz promene statusa.
* Centralizovano upravljanje logističkim resursima u okviru kompanije.
* Podrška za rad više korisnika sa jasno definisanim nivoima pristupa.
* REST API koji omogućava komunikaciju između frontend i backend aplikacije.

# Role i model pristupa

Sistem koristi **Role-Based Access Control (RBAC)** model kojim se određuje kojim funkcionalnostima i poslovnim podacima korisnik može pristupiti nakon prijave. Svakom korisniku dodeljuje se odgovarajuća uloga, a dozvole se primenjuju na nivou backend servisa i REST API endpointa.

| Uloga                     | Opis                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Company Administrator** | Upravlja kompanijom, korisnicima, poslovnim resursima i administrativnim podešavanjima sistema.               |
| **HR Manager**            | Upravlja zaposlenima, radnim mestima i organizacijom radne snage.                                             |
| **Warehouse Manager**     | Odgovoran je za skladišta, zalihe, inventure i skladišne operacije.                                           |
| **Dispatcher**            | Planira i koordinira transportne operacije, raspoređuje vozila, vozače i zadatke.                             |
| **Driver**                | Pristupa transportnim zadacima koji su mu dodeljeni i evidentira aktivnosti vezane za izvršavanje transporta. |
| **Worker**                | Izvršava skladišne zadatke, učestvuje u radu sa zalihama i inventurama u okviru svojih ovlašćenja.            |

Kontrola pristupa zasniva se na nekoliko nivoa:

* autentifikaciji korisnika pomoću JWT tokena;
* autorizaciji na osnovu korisničke uloge;
* proveri dozvola za svaku poslovnu operaciju;
* ograničavanju pristupa podacima u skladu sa kompanijom, skladištem ili drugim poslovnim opsegom gde je to primenjivo.

Pored kontrole pristupa, sistem primenjuje poslovna pravila koja određuju koje promene statusa i koje operacije su dozvoljene nad pojedinim entitetima. Na taj način sprečava se izvršavanje nedozvoljenih ili nelogičnih poslovnih akcija i obezbeđuje konzistentnost podataka tokom rada sistema.

# Tech Stack

## Backend

```text
Java 21                         — programski jezik
Spring Boot                     — razvoj REST API aplikacije
Spring Security                 — autentifikacija i autorizacija
JWT (JSON Web Token)            — bezbedna autentifikacija korisnika
Spring Data JPA (Hibernate)     — ORM i pristup bazi podataka
Microsoft SQL Server            — relaciona baza podataka
Maven                           — upravljanje zavisnostima i build sistem
Bean Validation                 — validacija ulaznih podataka
Lombok                          — smanjenje boilerplate koda
WebSocket                       — notifikacije i komunikacija u realnom vremenu
```

## Frontend

```text
React                           — razvoj korisničkog interfejsa
TypeScript                      — tipizacija JavaScript koda
Vite                            — razvojno i build okruženje
Material UI (MUI)               — biblioteka UI komponenti
React Router                    — rutiranje unutar aplikacije
Axios                           — komunikacija sa REST API servisom
React Hook Form                 — upravljanje formama i validacija
Recharts                        — grafički prikaz statističkih podataka
```

## Testiranje

```text
JUnit 5                         — unit i integracioni testovi backend aplikacije
Mockito                         — mockovanje zavisnosti u testovima
Spring Boot Test                — testiranje Spring Boot komponenti
Vitest                          — testiranje frontend aplikacije
React Testing Library           — testiranje React komponenti
Postman                         — funkcionalno testiranje REST API endpointa
```

## Arhitektura sistema

```text
Frontend (React + TypeScript)
            │
            │ HTTP / REST API
            ▼
Backend (Spring Boot)
            │
            │ Spring Data JPA
            ▼
Microsoft SQL Server
```

Aplikacija je razvijena kao višeslojni informacioni sistem u kojem je frontend zadužen za korisnički interfejs i komunikaciju sa korisnikom, backend implementira poslovnu logiku, validaciju i kontrolu pristupa, dok se svi poslovni podaci trajno čuvaju u relacionoj bazi podataka.

# Pokretanje lokalno

## Preduslovi

Pre pokretanja projekta potrebno je imati instalirano:

* Java 21
* Apache Maven
* Node.js 20 ili noviji
* Microsoft SQL Server
* Git

---

## 1. Kloniranje repozitorijuma

```bash
git clone https://github.com/filipDjekic/logistic-system.git
cd logistics-system
```

---

## 2. Pokretanje backend aplikacije

```bash
cd backend
./mvnw spring-boot:run
```

Ili na Windows operativnom sistemu:

```bash
mvnw.cmd spring-boot:run
```

Backend će biti dostupan nakon uspešne konekcije sa bazom podataka.

---

## 3. Pokretanje frontend aplikacije

U novom terminalu:

```bash
cd frontend
npm install
npm run dev
```

Frontend aplikacija će biti dostupna na razvojnom serveru koji prikazuje Vite nakon uspešnog pokretanja.

---

## 4. Pokretanje testova

### Backend

```bash
cd backend
mvn test
```

### Frontend

```bash
cd frontend
npm test
```

---

## Redosled pokretanja

1. Pokrenuti Microsoft SQL Server.
2. Podesiti konfiguraciju baze podataka.
3. Pokrenuti backend aplikaciju.
4. Pokrenuti frontend aplikaciju.
5. Pristupiti aplikaciji putem web pregledača.

# Podešavanje okruženja

Backend aplikacija koristi konfiguraciju definisanu u `application.properties` za povezivanje sa bazom podataka i podešavanje rada sistema.

Primer osnovne konfiguracije:

```properties
spring.datasource.url=jdbc:sqlserver://localhost:1433;databaseName=logistics_system;encrypt=true;trustServerCertificate=true
spring.datasource.username=VASE_KORISNICKO_IME
spring.datasource.password=VASA_SIFRA

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false

jwt.secret=VAS_KLJUC
jwt.expiration=86400000
```

## Opis najvažnijih podešavanja

| Parametar                       | Opis                                                |
| ------------------------------- | --------------------------------------------------- |
| `spring.datasource.url`         | Adresa Microsoft SQL Server baze podataka.          |
| `spring.datasource.username`    | Korisničko ime za pristup bazi.                     |
| `spring.datasource.password`    | Lozinka za pristup bazi.                            |
| `spring.jpa.hibernate.ddl-auto` | Način upravljanja šemom baze podataka.              |
| `spring.jpa.show-sql`           | Prikaz SQL upita tokom razvoja.                     |
| `jwt.secret`                    | Tajni ključ za generisanje i validaciju JWT tokena. |
| `jwt.expiration`                | Vreme važenja JWT tokena u milisekundama.           |

Frontend aplikacija koristi konfiguraciju definisanu u `.env` fajlu za adresu backend REST API-ja.

Primer:

```env
VITE_API_URL=http://localhost:8080/api
```

Pre pokretanja sistema potrebno je:

1. Kreirati ili ažurirati bazu podataka.
2. Podesiti parametre za povezivanje sa bazom.
3. Konfigurisati JWT parametre.
4. Podesiti URL backend aplikacije u frontend konfiguraciji.
5. Pokrenuti backend, a zatim frontend aplikaciju.

# Mapa projekta

```text
logistics-system/
│
├── backend/
│   ├── src/
│   │   └── main/
│   │       └── java/
│   │           └── rs/logistics/logistics_system/
│   │               ├── config/             # konfiguracija aplikacije i Spring okruženja
│   │               ├── controller/         # REST API endpointi
│   │               ├── dto/                # DTO objekti
│   │               ├── entity/             # JPA entiteti
│   │               ├── enums/              # enumeracije i statusi sistema
│   │               ├── exception/          # obrada i mapiranje grešaka
│   │               ├── lifecycle/          # životni ciklusi poslovnih entiteta
│   │               ├── mapper/             # mapiranje entiteta i DTO objekata
│   │               ├── observability/      # audit, događaji i praćenje sistema
│   │               ├── repository/         # pristup bazi podataka
│   │               ├── scheduler/          # zakazani poslovi
│   │               ├── security/           # JWT autentifikacija i autorizacija
│   │               └── service/            # poslovna logika aplikacije
│   │
│   ├── pom.xml                            # Maven konfiguracija
│   └── mvnw / mvnw.cmd                    # Maven Wrapper
│
├── frontend/
│   ├── src/
│   │   ├── app/                           # layout, rutiranje i provider-i
│   │   ├── assets/                        # slike i statički resursi
│   │   ├── core/                          # API klijent, autentifikacija i zajednička logika
│   │   ├── features/                      # funkcionalni moduli sistema
│   │   ├── shared/                        # zajedničke komponente, hook-ovi i util klase
│   │   ├── test/                          # pomoćni test resursi
│   │   └── types/                         # TypeScript tipovi
│   │
│   ├── package.json                       # frontend zavisnosti i skripte
│   └── vite.config.*                      # Vite konfiguracija
│
├── docs/                                  # projektna dokumentacija (ukoliko postoji)
├── README.md                              # dokumentacija projekta
└── .gitignore
```

Projekat je organizovan kao odvojene backend i frontend aplikacije koje međusobno komuniciraju putem REST API-ja. Backend je implementiran slojevitom arhitekturom (Controller → Service → Repository), pri čemu su poslovna logika, sigurnost, mapiranje podataka i pristup bazi jasno razdvojeni. Frontend je organizovan po funkcionalnim modulima, uz izdvojene zajedničke komponente i infrastrukturu za rutiranje, komunikaciju sa backend servisima i upravljanje stanjem aplikacije.

# API pregled

Sistem koristi REST arhitekturu za komunikaciju između frontend i backend aplikacije. Svi zaštićeni endpointi zahtevaju validan JWT token koji se prosleđuje kroz `Authorization: Bearer <token>` zaglavlje.

## Glavni API moduli

| Modul                     | Opis                                                                   |
| ------------------------- | ---------------------------------------------------------------------- |
| **Authentication API**    | Registracija korisnika, prijava, osvežavanje sesije i autentifikacija. |
| **Company API**           | Upravljanje kompanijama i njihovim osnovnim podacima.                  |
| **Employee API**          | Evidencija zaposlenih, njihovih podataka i organizacione strukture.    |
| **Role & Permission API** | Upravljanje korisničkim ulogama i dozvolama.                           |
| **Warehouse API**         | Kreiranje, izmena i pregled skladišta.                                 |
| **Warehouse Zone API**    | Upravljanje zonama unutar skladišta.                                   |
| **Bin API**               | Upravljanje skladišnim lokacijama (bin-ovima).                         |
| **Item API**              | Evidencija artikala i njihovih karakteristika.                         |
| **Inventory API**         | Pregled trenutnog stanja zaliha.                                       |
| **Stock Movement API**    | Prijem, izdavanje, transfer i ostale promene stanja zaliha.            |
| **Inventory Count API**   | Kreiranje i sprovođenje inventura.                                     |
| **Vehicle API**           | Upravljanje voznim parkom.                                             |
| **Maintenance API**       | Evidencija održavanja vozila.                                          |
| **Transport API**         | Planiranje i realizacija transportnih operacija.                       |
| **Task API**              | Kreiranje, dodela i praćenje operativnih zadataka.                     |
| **Shift API**             | Organizacija i upravljanje radnim smenama.                             |
| **Notification API**      | Slanje i pregled korisničkih obaveštenja.                              |
| **Activity API**          | Evidencija aktivnosti korisnika i poslovnih događaja.                  |
| **Dashboard API**         | Prikaz ključnih poslovnih pokazatelja.                                 |
| **Statistics API**        | Statistički izveštaji i grafički prikaz podataka.                      |
| **Import / Export API**   | Uvoz i izvoz poslovnih podataka.                                       |

## Karakteristike API-ja

* REST arhitektura sa JSON formatom razmene podataka.
* Standardizovani HTTP status kodovi za uspešne i neuspešne zahteve.
* Validacija ulaznih podataka pre izvršavanja poslovne logike.
* Kontrola pristupa na osnovu korisničkih uloga i dozvola.
* Podrška za pretragu, filtriranje, sortiranje i paginaciju gde je primenljivo.
* Jedinstvena obrada grešaka i standardizovani odgovori backend servisa.

# Kako je zaštićen sistem

Bezbednost sistema zasniva se na autentifikaciji korisnika, kontroli pristupa na osnovu korisničkih uloga i validaciji poslovnih pravila pre izvršavanja svake operacije. Na taj način obezbeđuje se da korisnici mogu pristupati isključivo funkcionalnostima i podacima za koje imaju odgovarajuća ovlašćenja.

## Autentifikacija

Prijava korisnika realizovana je korišćenjem **JWT (JSON Web Token)** mehanizma. Nakon uspešne autentifikacije korisniku se izdaje token koji se prosleđuje uz svaki naredni zahtev prema backend aplikaciji.

Backend validira token pre izvršavanja zaštićenih operacija i na osnovu identiteta korisnika određuje dozvoljeni nivo pristupa.

## Autorizacija

Kontrola pristupa implementirana je korišćenjem **Role-Based Access Control (RBAC)** modela.

Svaki korisnik poseduje jednu ili više uloga koje određuju kojim poslovnim funkcionalnostima može pristupiti. Pored provere korisničke uloge, sistem primenjuje i dodatna poslovna ograničenja kako bi se sprečio pristup podacima van dozvoljenog opsega.

## Validacija podataka

Pre izvršavanja svake poslovne operacije vrši se validacija ulaznih podataka i poslovnih pravila. Na taj način sprečava se unos neispravnih ili nekonzistentnih podataka u sistem.

## Životni ciklus poslovnih entiteta

Ključni poslovni entiteti koriste definisane životne cikluse sa kontrolisanim promenama statusa. Sistem dozvoljava samo validne prelaze između statusa, čime se sprečavaju nelogične ili nedozvoljene poslovne operacije.

## Evidencija aktivnosti

Sistem evidentira značajne poslovne događaje i aktivnosti korisnika. Evidencija omogućava praćenje promena nad poslovnim podacima i olakšava analizu izvršenih operacija.

## Dodatni mehanizmi zaštite

* JWT autentifikacija za sve zaštićene REST API endpoint-e.
* Kontrola pristupa na osnovu korisničkih uloga i dozvola.
* Validacija ulaznih podataka na backend strani.
* Centralizovana obrada izuzetaka i standardizovani odgovori sistema.
* Zaštita poslovnih operacija kroz proveru dozvoljenih promena statusa.
* Evidentiranje aktivnosti i promena nad ključnim poslovnim entitetima.
* Ograničavanje pristupa resursima u skladu sa poslovnim pravilima sistema.

# Testovi

Tokom razvoja projekta testirane su ključne funkcionalnosti backend i frontend aplikacije kako bi se proverila ispravnost poslovne logike, bezbednosti sistema i korisničkog interfejsa.

## Backend testiranje

Backend aplikacija testirana je korišćenjem **JUnit 5**, **Mockito** i **Spring Boot Test** biblioteka.

Testovi obuhvataju:

* autentifikaciju i autorizaciju korisnika;
* validaciju poslovnih pravila;
* rad servisnog sloja;
* REST API endpoint-e;
* obradu grešaka i izuzetaka;
* kontrolu pristupa na osnovu korisničkih uloga i dozvola.

## Frontend testiranje

Frontend aplikacija testirana je korišćenjem **Vitest** i **React Testing Library** biblioteka.

Testovi obuhvataju:

* prikaz React komponenti;
* korisničke forme i validaciju unosa;
* navigaciju između stranica;
* komunikaciju sa backend servisima;
* prikaz podataka i reakciju korisničkog interfejsa.

## Testiranje REST API-ja

Za proveru REST API-ja korišćen je **Postman**.

Testirani su:

* autentifikacija korisnika;
* CRUD operacije nad poslovnim entitetima;
* validacija ulaznih podataka;
* HTTP status kodovi;
* odgovor sistema u slučaju grešaka;
* autorizacija i zabrana pristupa nedozvoljenim resursima.

## Ručno testiranje

Pored automatskih testova izvršeno je i ručno testiranje kompletnih korisničkih tokova kroz aplikaciju.

Obuhvaćene su sledeće funkcionalnosti:

* registracija kompanije i korisnika;
* prijava i odjava korisnika;
* upravljanje zaposlenima;
* upravljanje skladištima;
* upravljanje artiklima i zalihama;
* upravljanje transportnim operacijama;
* upravljanje voznim parkom;
* kreiranje i izvršavanje operativnih zadataka;
* sprovođenje inventure;
* pregled dashboard-a i statistike;
* pretraga, filtriranje i paginacija podataka;
* istorija aktivnosti i notifikacije;
* responzivnost korisničkog interfejsa na različitim veličinama ekrana.

Kombinacijom automatskih i ručnih testova proverena je ispravnost najvažnijih funkcionalnosti sistema, bezbednosnih mehanizama i poslovnih procesa implementiranih u aplikaciji.
