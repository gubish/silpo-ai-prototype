#!/bin/sh
# Перегенерує vendor/mushroom-riv.js з assets/rive/mushroom_mvp.riv.
# Потрібно лише для відкриття index.html напряму з диска (file://),
# де браузер не дозволяє fetch(). Запускати після заміни .riv файлу:
#   sh tools/embed-rive.sh
cd "$(dirname "$0")/.."
{ printf "/* Згенеровано tools/embed-rive.sh з assets/rive/mushroom_mvp.riv. Не редагувати вручну. */\nwindow.RIVE_FILE_BASE64='"; base64 < assets/rive/mushroom_mvp.riv | tr -d '\n'; printf "';\n"; } > vendor/mushroom-riv.js
echo "OK: vendor/mushroom-riv.js"
