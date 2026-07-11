import httpx
import time

class ExchangeProvider:
    _usd_rate = None
    _fetched_at = 0
    _TTL = 3600

    @classmethod
    def get_usd_to_ngn_rate(cls) -> float:
        if cls._usd_rate and (time.time() - cls._fetched_at) < cls._TTL:
            return cls._usd_rate
        try:
            res = httpx.get("https://open.er-api.com/v6/latest/USD", timeout=5.0)
            cls._usd_rate = res.json().get("rates", {}).get("NGN", 1500.0)
            cls._fetched_at = time.time()
        except Exception:
            if not cls._usd_rate:
                cls._usd_rate = 1500.0
        return cls._usd_rate
