import json
from functools import lru_cache
from pathlib import Path

from rest_framework.response import Response
from rest_framework.views import exception_handler


class DomainError(Exception):
    def __init__(self, code: str, status_code: int = 400):
        self.code = code
        self.status_code = status_code
        super().__init__(code)


@lru_cache(maxsize=1)
def translations() -> dict[str, dict[str, str]]:
    root = Path(__file__).resolve().parents[3]
    i18n_dir = root / "packages" / "domain" / "src" / "i18n"
    return {
        "en": json.loads((i18n_dir / "en.json").read_text(encoding="utf-8")),
        "tr": json.loads((i18n_dir / "tr.json").read_text(encoding="utf-8")),
    }


def locale_from_request(request) -> str:
    language = request.headers.get("accept-language", "") if request else ""
    return "tr" if language.lower().startswith("tr") else "en"


def translate(code: str, request=None) -> str:
    locale = locale_from_request(request)
    messages = translations()
    return messages.get(locale, messages["en"]).get(code, messages["en"].get(code, code))


def localized_error(code: str, request=None, status_code: int = 400) -> Response:
    return Response({"code": code, "message": translate(code, request)}, status=status_code)


def localized_exception_handler(exc, context):
    request = context.get("request")
    if isinstance(exc, DomainError):
        return localized_error(exc.code, request, exc.status_code)

    response = exception_handler(exc, context)
    if response is None:
        return localized_error("errors.server", request, 500)

    code = "errors.validation.invalid" if response.status_code == 400 else "errors.server"
    if response.status_code == 401:
        code = "errors.auth.required"
    elif response.status_code == 403:
        code = "errors.auth.forbidden"
    elif response.status_code == 404:
        code = "errors.not_found"

    response.data = {"code": code, "message": translate(code, request), "details": response.data}
    return response
