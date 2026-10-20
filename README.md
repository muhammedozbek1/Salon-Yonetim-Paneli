# Beyaz Kuaför — Web Sitesi

İstanbul, Bayrampaşa'daki **Beyaz Kuaför** (erkek kuaförü / berber) için hazırlanmış statik web sitesi.

Veriler Google Maps üzerinden derlenmiştir (adres, telefon, çalışma saatleri, yorumlar, konum).

## Sayfalar

- `index.html` — Ana sayfa (hakkımızda, hizmetler, çalışma saatleri, yorumlar, iletişim, harita)
- `randevu.html` — Online randevu sistemi (localStorage tabanlı)
- `admin.html` — Yönetim paneli (klasik dashboard: sol menü + KPI şeridi)

## Çalıştırma

Statik dosyalar; herhangi bir HTTP sunucusu ile çalıştırılabilir:

```bash
python -m http.server 8000
```

Ardından `http://localhost:8000` adresini açın.

## Yönetim Paneli

- URL: `/admin.html` (`#pos`, `#history`, `#finance`, `#settings` ile sekmelere doğrudan erişilebilir)
- Varsayılan şifre: `beyaz2026` (panel içinden değiştirilebilir)

### Bölümler

- **Yeni İşlem** — Hizmet ve usta seçimi, ücret hesabı, ekstra hizmetler.
  - Ücret düzeltme butonları: artıranlar **mavi**, düşürenler **kırmızı**.
  - "İşlemi Tamamla" sonrası kayıt sağ paneldeki **Tamamlanan İşlemler** listesine düşer.
  - Bu ekran salt operasyondur; ciro metrikleri **Mali İşlemler** sekmesindedir.
- **Mali İşlemler** — Günlük/aylık/toplam ciro, günlük (son 14 gün) ve aylık (son 12 ay)
  ciro grafikleri, hizmet ve usta bazlı kırılımlar, öne çıkan istatistikler.
  - **Aylık PDF Rapor** (günlük dağılım grafiği + kırılımlar + gün dökümü) ve **Aylık CSV**.
- **Gün Sonu** — Seçili günün ciro raporu: KPI'lar, usta/hizmet bazlı döküm, işlem tablosu.
  - **PDF Rapor İndir** ve **CSV** ile dışa aktarma; gün "kapatılıp" yeniden açılabilir.
- **İş Geçmişi** — Tarih/usta/hizmet filtreleri, hızlı filtreler (Bugün / Bu Hafta / Bu Ay), PDF ve CSV çıktısı.
- **Ayarlar** — Hizmet adı/fiyat düzenleme, usta yönetimi, geçmişi temizleme.

### PDF motoru

Harici kütüphane kullanmaz: rapor Canvas'a çizilir, JPEG'e dönüştürülür ve tarayıcı içinde
elle yazılmış bir PDF yazıcıyla (`buildPdf`) tek sayfalık/A4 çok sayfalı PDF'e gömülür.
Türkçe karakterler (ş, ğ, ı, İ) sorunsuz görünür.

## Teknoloji

Saf HTML / CSS / JavaScript (framework yok). Veriler tarayıcı `localStorage`'ında saklanır.