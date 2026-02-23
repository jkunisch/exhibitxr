# Smoke Test Checklist

## Start
- [ ] `npm install --legacy-peer-deps`
- [ ] `npm run dev`
- [ ] Open `http://localhost:3000`

## Auth Flow
- [ ] Open `http://localhost:3000/register`
- [ ] Create a new account with company name, email, password
- [ ] Confirm redirect to `/dashboard`
- [ ] Verify dashboard header shows tenant id and user email

## Login Flow
- [ ] Sign out from dashboard
- [ ] Open `http://localhost:3000/login`
- [ ] Sign in with the same account
- [ ] Confirm redirect to `/dashboard`

## Exhibitions CRUD
- [ ] Open `/dashboard/exhibitions`
- [ ] Create exhibition via `/dashboard/exhibitions/new`
- [ ] Open created exhibition at `/dashboard/exhibitions/[id]`
- [ ] Update title/description/environment and save
- [ ] Delete exhibition using title confirmation
- [ ] Confirm item is removed from list

## Editor & Viewer
- [ ] Open `/dashboard/editor/[id]` for an existing exhibition
- [ ] Change form values and verify save status (Saving/Saved/Error)
- [ ] Click hotspot and verify camera fly-to behavior
- [ ] Open `http://localhost:3000/embed/demo` and verify viewer still renders

## Security Spot Checks
- [ ] Access `/dashboard` while logged out -> redirected to `/login`
- [ ] Login without tenant claim -> blocked with clear error
- [ ] Published/unpublished access behaves according to rules
