ASAS SERVICEUP PREVIEW - READY-TO-UPLOAD FILES

Place the included files into the existing ASAS website repository using these exact paths:

  serviceup/index.html                   REPLACE existing file
  assets/js/serviceup-enhancements.js    ADD new file

Do not delete or replace assets/js/serviceup-renderer.js.
The existing assets/css/site.css and original assets/img files are reused.

Then commit/push to GitHub (or upload both files), deploy through Netlify,
and hard-refresh /serviceup/ and /serviceup/articles/.

This update:
- Makes (ASAS) yellow on the ServiceUp home hero.
- Uses the original colored articles hero image.
- Shows the original featured images for 14 existing article cards.
- Recognizes optional heading_accent, accent_position, and article featured_image
  values from ServiceUp data if present.

NOTE: The ServiceUp Admin field schema is a separate codebase and is NOT
modified by these website files. Adding the editable fields in that schema
is still necessary to expose them as editor inputs.

Only the ServiceUp staging preview is changed; live site pages are untouched.
