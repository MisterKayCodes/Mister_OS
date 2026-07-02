import httpx

class ExchangeProvider:
    _usd_rate = None

    @classmethod
    def get_usd_to_ngn_rate(cls) -> float:
        if cls._usd_rate:
            return cls._usd_rate
        try:
            res = httpx.get("https://open.er-api.com/v6/latest/USD", timeout=5.0)
            cls._usd_rate = res.json().get("rates", {}).get("NGN", 1500.0)
        except Exception:
            cls._usd_rate = 1500.0
        return cls._usd_rate
