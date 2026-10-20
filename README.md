# Beyaz Kuaför — Web Sitesi + Yönetim Paneli

İstanbul, Bayrampaşa'daki **Beyaz Kuaför** (erkek kuaförü / berber) için hazırlanmış,
**çoklu site (multi-tenant)** yapısına sahip statik web sitesi ve yönetim paneli.

Her site kendi kullanıcı/şifresiyle giriş yapar, kendi müşterilerine kendi
randevularını açar ve verilerini **sunucuda** tutar — böylece aynı veri
telefondan, tabletten veya bilgisayardan görülür.

## Çalıştırma

**En kolay yol:** Proje klasöründe **`baslat.bat`** dosyasına çift tıklayın.
Sunucu otomatik başlar ve tarayıcı açılır.

**Terminal ile:**

```bash
node server.js          # → http://localhost:8000
# veya
npm start
```

Farklı port: `PORT=3000 node server.js`

> Sunucu harici paket kullanmaz (yalnızca Node.js yerleşik modülleri).
> `npm install` gerekmez.

> **Önemli:** Giriş ve veri kaydı **sunucuya bağlıdır**. `index.html` dosyasına
> çift tıklayarak (file://) veya `python -m http.server` ile açmak **çalışmaz** —
> mutlaka `node server.js` ile `http://localhost:8000` adresinden açın.
> Sunucu kapalıysa giriş ekranı "Sunucuya ulaşılamıyor" uyarısı verir.

### Varsayılan giriş bilgileri

| Site | Kullanıcı | Şifre |
|---|---|---|
| `beyaz` (kök site) | `admin` | `beyaz2026` |
| `ornek` (örnek site) | `admin` | `beyaz2026` |

Panelin **Ayarlar → Kullanıcılar** bölümünden değiştirin.

## Sayfalar

| Dosya | Açıklama |
|---|---|
| `index.html` | Ana site (Beyaz Kuaför) — özelleştirilebilir |
| `randevu.html` | Müşteri randevu formu (herkese açık) |
| `login.html` | **Yönetim paneli giriş ekranı** (kullanıcı + şifre) |
| `admin.html` | Yönetim paneli (oturum açmadan erişilemez) |
| `sites/<id>/index.html` | Ek sitelerin kendi index sayfaları |
| `site.json` | Site kimliği ve görünen bilgiler (ad, slogan, telefon, adres, tema) |

## Giriş ve kullanıcı yönetimi

- **Index sayfasının header'ında "Yönetim Paneli" butonu** vardır → `login.html`.
- Giriş ekranı: **site seçimi + kullanıcı adı + şifre**.
- Varsayılan kullanıcı: `admin` / `beyaz2026` (her site için otomatik oluşturulur).
- Panelin **Ayarlar → Kullanıcılar** bölümünden yeni kullanıcı eklenir/silinir,
  **şifre değiştirilir**.
- Şifreler `scrypt` + rastgele tuz ile saklanır (açık metin yok).
- Oturum `httpOnly` çerez ile 7 gün geçerli; **Çıkış Yap** butonu panelin sol
  menüsündedir.

## Veri nerede?

Veriler **sunucuda** `data/db.json` dosyasında, **site başına ayrı** tutulur.

| Anahtar | İçerik |
|---|---|
| `beyaz_admin_jobs` | Tamamlanan işlemler (ciro, usta, hizmet, ödeme yöntemi) |
| `beyaz_admin_services` | Hizmet listesi (ad + fiyat) |
| `beyaz_admin_masters` | Usta listesi |
| `beyaz_admin_closed_days` | Kapatılan (kilitlenen) günler |
| `beyaz_admin_commission` | `{ defaultRate, masterRates, serviceRates }` |
| `beyaz_admin_rate_history` | Oran değişiklik geçmişi |
| `beyaz_admin_master_payments` | Usta ödemeleri |
| `beyaz_admin_cash_closings` | Kasa gün sonu kapanışları + düzeltme kayıtları |
| `beyaz_admin_schema` | Migration sürümü |
| `beyaz_kuafor_randevular` | Müşteri online randevuları |

`data/db.json` dosyası `.gitignore` içindedir — **yedek almak için bu dosyayı kopyalayın.**

### Senkronizasyon

- Yazılan her kayıt anında sunucuya gönderilir (`PUT /api/data/<anahtar>`).
- Başka cihazdaki değişiklikler **10 saniyede bir** çekilir ve ekranda yenilenir.
- Sunucuya ulaşılamazsa veriler tarayıcıda önbelleklenir, bağlantı gelince gönderilir.

## Finans PIN Kilidi

**Mali İşlemler**, **Kasa** ve **Gün Sonu** ekranları PIN kodunun arkasındadır.
Bu ekranlara tıklandığında ekrana **PIN kartı** açılır; kartta yalnızca rakam
tuşları vardır.

| Ekran | Nasıl açılır | Kart başlığı |
|---|---|---|
| Mali İşlemler | Sol menü → *Mali İşlemler* | Mali İşlemler Kilidi |
| Kasa | Sol menü → *Kasa* | Kasa Kilidi |
| Gün Sonu | POS ekranındaki *Gün Sonu* butonu / Mali İşlemler raporları | Gün Sonu Kilidi |

- Doğru PIN girilince ekran açılır.
- Yanlış PIN'de "Yanlış PIN." uyarısı çıkar, kart açık kalır, rakamlar sıfırlanır.
- Kart açıldığında nokta sayısı PIN uzunluğuna göre (4-6 rakam) ayarlanır ve
  doğru uzunlukta otomatik olarak doğrulanır.
- **Kilit her girişte yeniden istenir:** finansal alandan çıkıldığı anda (ör.
  *İş Geçmişi*, *Ayarlar* ya da *Gün Sonu* raporunu kapattığınızda) kilit kendini
  yeniden kurar ve bir sonraki girişte PIN tekrar istenir.
  *Kasa* ↔ *Mali İşlemler* gibi finansal alan içindeki geçişlerde PIN tekrar sorulmaz.
- Klavyeden rakam yazmak da mümkündür (Enter = Kilidi Aç, Backspace = sil).
- Kilitliyken kasa verisi ekrana çizilmez.
- Varsayılan PIN: **`1234`** — Ayarlar → PIN Kodu bölümünden değiştirilir.

| Uç nokta | Yetki | Açıklama |
|---|---|---|
| `GET /api/pin` | oturum | PIN tanımlı mı / uzunluğu |
| `PUT /api/pin` | oturum | Yeni PIN belirle (4-6 rakam) |
| `POST /api/pin/verify` | oturum | PIN doğrula (5 dk'da 8 hatalı deneme sınırı) |

PIN sunucuda **scrypt + tuz** ile saklanır; tüm cihazlarda aynı geçerlidir.

## Yönetim Paneli

- URL: `/admin.html` — giriş yapılmadan açılırsa otomatik olarak `login.html`'e yönlendirilir.
- Sekmeler: `#pos` (Yeni İşlem), `#appointments` (**Online Randevular**), `#history`,
  `#finance`, `#masters`, `#kasa`, `#pay`, `#settings`.
- **Online Randevular** sekmesinde müşterilerin siteden aldığı randevular listelenir,
  tarihe göre filtrelenir ve iptal edilebilir.

### Bölümler

- **Yeni İşlem** — Hizmet ve usta seçimi, ücret hesabı, ekstra hizmetler.
  - Ücret düzeltme butonları: artıranlar **mavi**, düşürenler **kırmızı**.
  - "İşlemi Tamamla" sonrası kayıt sağ paneldeki **Tamamlanan İşlemler** listesine düşer.
  - Bu ekran salt operasyondur; ciro metrikleri **Mali İşlemler** sekmesindedir.
- **Online Randevular** — Siteden gelen müşteri randevuları (tarih/saat/müşteri/telefon/not).
- **Mali İşlemler** — Günlük/aylık/toplam ciro, günlük (son 14 gün) ve aylık
  (son 12 ay) ciro grafikleri, hizmet ve usta bazlı kırılımlar, öne çıkan istatistikler.
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
- **Ayarlar** — Hizmet adı/fiyat düzenleme, usta yönetimi, **PIN kodu** (Mali İşlemler
  kilidi), **site bilgileri** (index sayfasında görünen ad/slogan/telefon/adres),
  **kullanıcı yönetimi**, eski tarayıcı verisini içe aktarma, geçmişi temizleme.

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

### PDF motoru

Harici kütüphane kullanmaz: rapor Canvas'a çizilir, JPEG'e dönüştürülür ve tarayıcı içinde
elle yazılmış bir PDF yazıcıyla (`buildPdf`) tek sayfalık/A4 çok sayfalı PDF'e gömülür.
Türkçe karakterler (ş, ğ, ı, İ) sorunsuz görünür.

## Yeni site eklemek (çoklu site)

1. `sites/<id>/` klasörü oluşturun.
2. İçine `site.json` (ad, slogan, telefon, adres, tema) ve kendi `index.html` dosyanızı koyun.
3. `index.html` içine `<meta name="site-id" content="<id>" />` ekleyin ve
   `store.js` + `site-loader.js` dosyalarını yükleyin.
4. Sunucuyu yeniden başlatın — site otomatik kaydedilir, kendi kullanıcısı
   (`admin` / `beyaz2026`) ve boş veri tablosuyla açılır.
5. `login.html` ekranında site açılır listede görünür.

### Index sayfasını özelleştirme

`site.json` içindeki alanlar `data-site="..."` ile işaretlenmiş yerlere otomatik uygulanır
(`name`, `tagline`, `heroBadge`, `heroSub`, `address`, `phone`, `initial`, `hours`).
Tema renkleri `theme.accent` / `theme.accentDark` ile `--gold` değişkenine yazılır.
Panelden **Ayarlar → Site Bilgileri** ile değiştirilebilir.

## API özeti

| Uç nokta | Yetki | Açıklama |
|---|---|---|
| `GET /api/sites` | herkese açık | Site listesi |
| `GET /api/site/:id` | herkese açık | Site bilgileri (index özelleştirme) |
| `POST /api/login` | herkese açık | Giriş (site + kullanıcı + şifre) |
| `POST /api/logout` | oturum | Çıkış |
| `GET /api/me` | oturum | Oturum bilgisi |
| `GET /api/data` | oturum | Sitenin tüm tabloları |
| `PUT /api/data/:key` | oturum | Tek tablo yazımı |
| `PUT /api/data/batch` | oturum | Toplu yazım |
| `GET/POST/PATCH /api/users` | oturum | Kullanıcı yönetimi |
| `POST /api/password` | oturum | Şifre değiştirme |
| `PUT /api/site` | oturum | Site bilgilerini güncelle |
| `GET /api/appointments?site=&date=` | herkese açık | Dolu saatler (kişisel bilgi yok) |
| `GET /api/appointments?site=&phone=` | herkese açık | Yalnızca o telefona ait randevular |
| `POST /api/appointments` | herkese açık | Randevu oluştur (çakışma korumalı) |
| `PATCH /api/appointments/:id` | herkese açık | Randevu iptal |

## Güvenlik notları

- Şifreler `scrypt` ile hash'lenir; oturum çerezi `httpOnly` + `SameSite=Lax`.
- Giriş ve randevu uçları IP başına hız sınırlamalıdır.
- Randevu listesi herkese açık değildir: müşteri yalnızca **kendi telefon numarasıyla**
  randevularını görür.
- Sunucu `data/` ve `.git/` klasörlerini dışarıya servis etmez.

## Teknoloji

Saf HTML / CSS / JavaScript (framework yok) + Node.js yerleşik modülleriyle yazılmış
sunucu. Veriler sunucuda JSON dosyasında saklanır.
