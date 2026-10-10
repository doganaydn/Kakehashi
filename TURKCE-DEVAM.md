# Kakehashi Türkçe — kişisel Android denemesi

Kaynak sürüm: 69244d9747325c04ae70694f96053ecc376672bc (10 Ekim 2026).
Ana proje: https://github.com/Portego-00/Kakehashi
Yerel dal: turkish-content. Ana proje uzak bağlantısı: upstream.
Henüz kullanıcının GitHub hesabında uzak fork veya origin bağlantısı oluşturulmadı.

## İlk deneme

Telefon uygulamasının kelime ve kanji ayrıntı ekranlarında Türkçe içerik gösterimi eklendi. Ayarlar → Appearance → Türkçe öğrenme içeriği anahtarı açık başlar; kapatılınca özgün İngilizce gösterilir. Menü dili değişmez. 21 anlam ve yalnız ayrı ikinci kontrolden geçmiş 35 cümle gösterilebilir. Üç ek demo cümlesi hazır olarak gösterilmez.

Japonca cümle korunur; Türkçe çeviri ve hedef kullanım açıklaması altında gösterilir. İngilizce kaynak bir düğmeyle açılır. Mevcut cümle çevirisini gizleme/gösterme ayarları kullanım açıklamasını da gizler. Japonca seslendirme ve Anki dışa aktarması özgün kaynağı kullanır. Cevap kabulü, kişisel notlar ve WaniKani eş anlamlılarına bu modül yazmaz.

Kaynak konu kimliği, tür, yazılış, anlam ve okunuşlarıyla eşlenir; cümle Japonca–İngilizce tam metin çiftiyle bulunur. Sıra değişmesi eşleşmeyi bozmaz. Kaynak değişmesi, eksik kayıt veya geçersiz paket İngilizceye dönüş sağlar. İçerik bu ilk sürümde APK içine gömülüdür; internetten paket güncelleme arayüzü henüz uygulanmadı. İçerik yenilemek şu anda yeni APK gerektirir.

## Ayrı kurulum

Ad: Kakehashi Türkçe. Android kimliği: com.portego00.kakehashi.tr. Mevcut mağaza uygulamasının yanında kurulur; ayrı cihaz depolaması kullanır. İlk açılışta WaniKani hesabı uygulamanın normal akışıyla bağlanır. Bu kaynak ağacına .env/token veya kişisel hesap verisi kopyalanmadı.

Ana geliştiricinin Expo güncelleme adresi kaldırıldı ve uzaktan kod güncellemeleri kapatıldı; kişisel sürümün Türkçe değişiklikleri bu kanaldan üzerine yazılmaz. Bu ilk APK kişisel test için mevcut geliştirme anahtarıyla imzalanır; mağaza dağıtımı için ayrı imzalama tasarımı gerekir. SDK/Java ve önbellekler .local-tools altında, Git dışında tutulur.

## Güncellemeleri alma

Türkçe modül src/features/turkish-content altında. Ana ekranlarda az sayıda bağlantı var. Yeni sürüm için önce upstream/main alınır, yerel dala birleştirilir, çakışmalar çözülür; sonra aynı testler ve Android derlemesi yapılır. Reset/force sync ile Türkçe dalı ana projeyle birebir değiştirilmez. Ana projedeki günlük her commit yerine uygun bir kararlı sürüm almak tercih edilir.

Birleştirme komutları: `git fetch upstream main`, ardından `git merge upstream/main`. Çakışma varsa çözülmeden APK üretilmez. İlk kopya sığ klondur; geçmiş araştırması gerekirse `git fetch --unshallow upstream` kullanılabilir.

## İçeriği yenileme

Üst projedeki kakehashi-demo-guncelle.py, kontrol edilmiş kaynakları demo sözleşmesine aktarır. Üretilen paylasim/kakehashi-tr-demo/tr-demo.json dosyası src/data/tr-learning-pilot.json yerine alınır. Paket kaynak kontrol testleri çalıştırılır. Dosya kullanıcı onaylarını veya gönderim durumlarını taşımaz.

## Kontroller

Türkçe çözümleyici, dil anahtarı, kelime gizleme/gösterme, mevcut kanji ekranı ve cevap kontrolü: 5 test grubunda 52 test geçti. Hedefli ESLint: hata 0; mevcut VocabularyDetails içinde 3 uyarı var. Genel TypeScript kontrolünde projenin diğer ekran/test/web dosyalarında hatalar bulunuyor; yeni Türkçe modül dosyalarında hata kalmadı. Bu durum tüm projenin tip kontrolü geçtiği şeklinde sunulmaz. Fiziksel Android telefonda kontrol henüz yapılmadı.

Yerel araç kurulumu scripts/prepare-personal-android-tools.py ile hazırlanır. SDK 36, build-tools 36.0.0, NDK 27.1.12297006 ve CMake 3.22.1 gerekir. BUILD-ANDROID.ps1 kişisel ARM64 APK üretim komutunu içerir.

Telefon: Samsung Galaxy A55, SM-A556E/DS. Hedef ABI arm64-v8a. Windows uzun yol sınırı nedeniyle BUILD-ANDROID.ps1 kaynakları C:\Users\Doan\kakehashi-tr-android-build altında ayrı derleme kopyasına aktarır; Gradle önbelleği C:\Users\Doan\kakehashi-tr-gradle-cache altında tutulur. Bu iki klasör kaynak projenin yerine geçmez. /MIR veya kaynak silme kullanılmaz. Başarılı APK asıl kaynak ağacındaki android/app/build/outputs/apk/release/app-release.apk yoluna kopyalanır. Yalnız subst kullanmak Expo'nun gerçek yol çözümlemesinde farklı sürücü köklerine yol açtığı için yeterli olmadı.

## Telefonda denenecekler

上げる (2490), まだ (9208), 改まる (4204), 宜しく (6338), 庄園 (7040), 升 (8599) ve kanji 一 (440). Türkçe anahtarı kapatıp aç; İngilizce kaynağı aç; çeviri gizleme ayarını dene. Paket dışında bir kelimede İngilizceye dönüşü kontrol et. Ders/tekrar açıklama ekranları ve uzaktan içerik güncellemesi sonraki kapsamdır.
