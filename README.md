# Beyaz Kuaför — Web Sitesi

İstanbul, Bayrampaşa'daki **Beyaz Kuaför** (erkek kuaförü / berber) için hazırlanmış statik web sitesi.

Veriler Google Maps üzerinden derlenmiştir (adres, telefon, çalışma saatleri, yorumlar, konum).

## Sayfalar

- `index.html` — Ana sayfa (hakkımızda, hizmetler, çalışma saatleri, yorumlar, iletişim, harita)
- `randevu.html` — Online randevu sistemi (localStorage tabanlı)
- `admin.html` — Yönetim paneli (iş kaydı, geçmiş, CSV dışa aktarma, ayarlar)

## Çalıştırma

Statik dosyalar; herhangi bir HTTP sunucusu ile çalıştırılabilir:

```bash
python -m http.server 8000
```

Ardından `http://localhost:8000` adresini açın.

## Yönetim Paneli

- URL: `/admin.html`
- Varsayılan şifre: `beyaz2026` (panel içinden değiştirilebilir)

## Teknoloji

Saf HTML / CSS / JavaScript (framework yok). Veriler tarayıcı `localStorage`'ında saklanır.