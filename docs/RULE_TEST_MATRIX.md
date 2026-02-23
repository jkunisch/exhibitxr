# Firebase Rule Test Matrix

Diese Matrix dient zur Verifikation der korrekten Implementierung von `firestore.rules` und `storage.rules`.

## Vorbedingungen
- User A: Member von Tenant A, Rolle `owner`
- User B: Member von Tenant A, Rolle `editor`
- User C: Member von Tenant B, Rolle `owner`
- User D: Unauthentifizierter Gast

## Firestore `firestore.rules`

| Aktion / Ziel | User A (Owner A) | User B (Editor A) | User C (Owner B) | User D (Unauth) |
| :--- | :--- | :--- | :--- | :--- |
| **Read:** `/tenants/A` | Erlaubt | Erlaubt | Verboten | Verboten |
| **Write:** `/tenants/A` | Erlaubt | Verboten | Verboten | Verboten |
| **Read:** `/tenants/A/members/B` | Erlaubt | Erlaubt | Verboten | Verboten |
| **Write:** `/tenants/A/members/B` | Erlaubt | Verboten | Verboten | Verboten |
| **Read:** `/tenants/A/exhibitions/1` (isPublished: false) | Erlaubt | Erlaubt | Verboten | Verboten |
| **Read:** `/tenants/A/exhibitions/2` (isPublished: true) | Erlaubt | Erlaubt | Erlaubt | Verboten (Firestore Reads for pub erfordern isTenantMember oder isPublished==true, Gast-Reads sind möglich wenn explizit abgefragt. *Achtung: unauth Gast ist generell geblockt wenn `isSignedIn()` fehlschlägt. Firestore rules erlaubt aktuell Gast Read auf publizierte Exhibitions via `resource.data.isPublished == true` ODER `isTenantMember`. Da isTenantMember `isSignedIn()` prüft, aber die OR-Klausel das nicht zwingend macht, kann ein Gast das Dokument lesen.*) |
| **Write:** `/tenants/A/exhibitions/1` | Erlaubt | Erlaubt | Verboten | Verboten |

## Storage `storage.rules`

| Aktion / Ziel | User A (Owner A) | User B (Editor A) | User C (Owner B) | User D (Unauth) |
| :--- | :--- | :--- | :--- | :--- |
| **Write:** `/tenants/A/models/test.glb` | Erlaubt | Erlaubt | Verboten | Verboten |
| **Read:** `/tenants/A/models/test.glb` (isPublished: "false") | Erlaubt | Erlaubt | Verboten | Verboten |
| **Read:** `/tenants/A/models/test.glb` (isPublished: "true") | Erlaubt | Erlaubt | Erlaubt | Erlaubt |
| **Write:** `/global/config.json` (Nicht in Rules definiert) | Verboten | Verboten | Verboten | Verboten |
