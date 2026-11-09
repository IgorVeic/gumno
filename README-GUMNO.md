# Gumno — October CMS 4

Modern rebuild of gumno.com.mk on October CMS v4.4.13, running under Laragon.

## Local URLs
- Frontend: http://gumno.test/
- Backend: http://gumno.test/admin
- Login: `admin` / `Admin123!`

## Stack
- October CMS 4.4.13
- PHP 8.2.35 / 8.3.36 / 8.4.27 in `C:\laragonin\php\`
- Active PHP: 8.3.36
- MySQL database: `gumno` (user `root`, empty password)
- Theme: `themes/gumno`

## Switch PHP version in Laragon
Menu → PHP → pick 8.2.35 / 8.3.36 / 8.4.27 → Reload Apache

## Notes
- Original images and content from gumno.com.mk
- GSAP animations (respects prefers-reduced-motion)
- Fonts, GSAP and images are self-hosted for PageSpeed
- Catalog PDF: `themes/gumno/assets/pdf/katalog-na-proizvodi.pdf`

Project path: `C:\laragon\www\gumno`

## License
Tried attaching project key via `php artisan project:set`.
October gateway response: license unpaid or expired.
Re-check/renew at https://octobercms.com then run:
`php artisan project:set YOUR-KEY`
