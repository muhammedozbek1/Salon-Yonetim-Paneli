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

- URL: `/admin.html` (`#pos`, `#history`, `#finance`, `#masters`, `#kasa`, `#pay`, `#settings` ile sekmelere doğrudan erişilebilir)
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
- **Usta Hesapları** — Günlük/haftalık/aylık/özel aralık dönem seçimi; işlem sayısı, ciro,
  usta hak edişi, dükkan payı, ödenen ve kalan bakiye. Usta detayında işlem listesi
  (tarih, hizmet, ücret, uygulanan oran, usta payı) ve usta ödemesi kaydı (tarih, tutar, not).
- **Kasa** — Nakit/kart cirosu, toplam ciro, ustalara ödenen; gün sonu kapanışında beklenen
  nakit ile kasadaki gerçek nakit karşılaştırılır, fark (fazla/eksik) ve not gösterilir.
  Kapatılan gün kilitlenir; sonradan değişiklik gerekçeli **düzeltme kaydı** ile yapılır.
- **Pay Ayarları** — Varsayılan pay oranı, usta başına oran, hizmet bazlı istisna
  (usta + hizmet) ve oran değişiklik geçmişi (kim, ne zaman, eski → yeni).
- **Ayarlar** — Hizmet adı/fiyat düzenleme, usta yönetimi, geçmişi temizleme.

### Pay (komisyon) modeli

- Öncelik: **hizmet bazlı oran > usta bazlı oran > varsayılan oran**.
- Oran, işlem kaydedilirken **snapshot** olarak işleme yazılır; sonradan oran değişimi
  geçmiş işlemleri etkilemez.
- Tüm parasal değerler **kuruş cinsinden tam sayı** saklanır (`amountKurus`,
  `masterShareKurus`, `shopShareKurus`); oran çevrimi `Math.round(kurus * rate / 100)`
  ile yapılır, floating point hatası oluşmaz.
- Ödeme yöntemi (`paymentMethod`: `cash` / `card`) işlem akışına eklenmiştir;
  eski kayıtlar için varsayılan `cash` kabul edilir.

### Yeni tablolar (migration)

`admin-pay.js` açılışta `beyaz_admin_schema` sürüm damgasını kontrol eder ve gerekirse
migratörü çalıştırır. **Mevcut kayıtların değerleri değiştirilmez**, sadece eksik yeni
alanlar eklenir.

| Anahtar | İçerik |
|---|---|
| `beyaz_admin_commission` | `{ defaultRate, masterRates, serviceRates }` |
| `beyaz_admin_rate_history` | Oran değişiklik geçmişi |
| `beyaz_admin_master_payments` | Usta ödemeleri (tarih, usta, tutar, not) |
| `beyaz_admin_cash_closings` | Kasa gün sonu kapanışları + düzeltme kayıtları |
| `beyaz_admin_schema` | Migration sürümü (`2`) |

### PDF motoru

Harici kütüphane kullanmaz: rapor Canvas'a çizilir, JPEG'e dönüştürülür ve tarayıcı içinde
elle yazılmış bir PDF yazıcıyla (`buildPdf`) tek sayfalık/A4 çok sayfalı PDF'e gömülür.
Türkçe karakterler (ş, ğ, ı, İ) sorunsuz görünür.

## Teknoloji

Saf HTML / CSS / JavaScript (framework yok). Veriler tarayıcı `localStorage`'ında saklanır.