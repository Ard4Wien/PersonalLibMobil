<p align="center">
  <img src="assets/images/icon.png" width="120" alt="PersonalLib Logo" />
</p>

<h1 align="center">PersonalLib-Mobil</h1>

<p align="center">
  <sub>Dizi, Film, Kitap, Manga, Çizgi Roman ve Anime koleksiyonlarınızı yönetmek ve paylaşmak için kapsamlı bir dijital kütüphane ve portfolyo sistemi.</sub>
</p>

<p align="center">
  <a href="https://github.com/Ard4Wien/PersonalLib/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-CC%20BY--NC%204.0-blue?style=flat-square" alt="Lisans" /></a>
  <a href="https://personal-lib.vercel.app/books"><img src="https://img.shields.io/badge/platform-Web-blue?style=flat-square" alt="Web" /></a>
  <a href="https://github.com/Ard4Wien/PersonalLibMobil"><img src="https://img.shields.io/badge/--Mobile-blue?style=flat-square" alt="Mobile" /></a>
</p>

---

## Önemli Not!
 .apk Dosyasını indirirken **Google Play Store** sizi uyaracaktır. Bu durum tamamiyle uygulamanın lisanssız olmasından kaynaklıdır. Gönül rahatlığı ile kurabilirisiniz.

---


**PersonalLib-Mobil**, dijital kütüphanesini her an yanında taşımak isteyenler için geliştirdiğim, modern ve kullanıcı dostu bir mobil uygulama. Sadece bir kayıt listesi olmanın ötesinde, koleksiyonlarınızı platformlar arası senkronize eden ve başkalarıyla paylaşmanıza olanak tanıyan bir dijital portfolyo görevi görüyor.

## Neler Var?

- **Geniş Koleksiyon Yönetimi:** Kitaplardan mangalara, dizi bölümlerinden filmlere kadar her şeyi tek bir yerden takip edebilirsiniz.
- **Hızlı Hesap Geçişi:** Birden fazla hesabınız varsa, şifrelerle uğraşmadan cihaz üzerinden anında geçiş yapabilirsiniz. Özellikle aile paylaşımları için çok kullanışlı.
- **Görsellik ve Tema:** Uygulama içinde 17 farklı tema var (Dracula, Nord, Solarized vb.). Kendi tarzınıza göre seçebiliyorsunuz.
- **Güvenli ve Yerel:** Hassas bilgileriniz `SecureStore` ile cihazda güvenli tutulur. Ayrıca, arka plana aldığınızda ekranın otomatik kararması gibi gizlilik odaklı özellikler de ekledim.
- **Çoklu Dil:** Şu an Türkçe ve İngilizce başta olmak üzere 12 dil desteği mevcut.

---

## 🛠 Teknoloji Yığını (Tech Stack)

*   **Çekirdek:** [Expo](https://expo.dev/) & [React Native](https://reactnative.dev/) (SDK 54)
*   **Navigasyon:** [Expo Router](https://docs.expo.dev/router/introduction/) (Type-safe, file-based routing)
*   **Stil Yönetimi:** [NativeWind](https://www.nativewind.dev/) (Tailwind CSS v4)
*   **Veri Yönetimi:** [TanStack Query v5](https://tanstack.com/query/latest) (Server state management)
*   **Depolama:** [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/) (Hassas veriler) & [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) (Ayarlar)
*   **İkonlar:** [Lucide React Native](https://lucide.dev/guide/packages/lucide-react-native)
*   **Validasyon:** [Zod](https://zod.dev/)

---

## 📁 Proje Yapısı

Projenin organizasyonu, genişletilebilirliği ve sürdürülebilirliği temel alacak şekilde düzenlendi:

```text
├── app/               # Uygulama rotaları, ekranlar ve modallar (Expo Router)
├── components/        # Yeniden kullanılabilir UI bileşenleri ve özellik bazlı öğeler
│   ├── ui/           # Temel UI bileşenleri (Button, Input, Modal vb.)
│   ├── auth/         # Kimlik doğrulama ile ilgili bileşenler
│   └── media/        # Kitap, Film ve Dizi bazlı bileşenler
├── contexts/          # Global state (Dil, Tema, Kimlik Doğrulama sağlayıcıları)
├── lib/               # Merkezi araçlar
│   ├── api.ts        # API istekleri ve sanitization katmanı
│   ├── i18n.ts       # 12 dil destekli yerelleştirme sistemi
│   └── themes.ts     # 17 farklı tema yapılandırması
├── hooks/             # Özel React hook'ları
├── assets/            # İkonlar, görseller ve fontlar
└── constants/         # Sabit değerler ve global ayarlar
```

---

## Nasıl Çalıştırılır?

Projeyi kendi ortamınızda denemek isterseniz:

1. Bağımlılıkları kurun:
   ```bash
   npm install
   ```

2. Geliştirici sunucusunu başlatın:
   ```bash
   npx expo start
   ```

---

## Lisans

Bu proje **Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)** kapsamında lisanslanmıştır.
- Ticari olmayan amaçlarla paylaşmakta ve uyarlamakta özgürsünüz.
- Orijinal yazara atıfta bulunulması zorunludur.

---

<p align="center">
  <a href="https://github.com/Ard4Wien">ArdaWien</a> tarafından geliştirildi
</p>
