# Kakehashi Türkçe — güncel çalışma özeti

Fork: https://github.com/doganaydn/Kakehashi · Dal: turkish-content.
Upstream: Portego-00/Kakehashi; e9d29f4 güncellemesi birleştirildi.

- Derlenmiş kişisel Android sürümü: 1.5.0-tr.17 / code 42 / arm64-v8a. Son kaynak derleme/teslim sonucu ana projenin BUILD-MANIFEST-tr.17.json kaydında tutulur.
- Uygulama kimliği: com.portego00.kakehashi.tr. Önceki kişisel imza ve kapalı upstream OTA korunur.
- Kullanıcı önceki tr.15 APK'yı telefonunda sorunsuz kullandığını bildirdi; her özellik ayrı doğrulanmış sayılmaz.
- Güncel dosya: translation-packages/wanikani-tr-v3.json, paket 1.5.0.
- 1–60 anlamları, 491 radikal, 1–15 seviyelerden 5.522 cümle ve kullanım açıklaması.
- Veri APK'ya gömülü değildir; Settings → Appearance üzerinden içe aktarılır.
- Seçimli eş anlam aktarımı ve geri alma açık kullanıcı onayı gerektirir; otomatik aktarım yok.
- Android arayüzünde İngilizce varsayılan; Appearance → App language ile Türkçe seçilebilir. Öğrenme paketi ve UI dili ayrıdır. Çevrimdışı kaynaklar runtime'a bağlıdır; dil tercihi Android widget/bildirim tarafında da saklanır.
- Türkçe UI kataloğu taslak ve ayrıca düzeltilmiş metinlerden oluşur. Tüm ekranların cihaz kontrolü ve uzun metinlerin dilsel ikinci kontrolü bitmiş sayılmaz. Ayrıntı: localization/ANDROID-YERELLESTIRME.md.

## Çalışma kuralları

Tamamlanan uygulama değişiklikleri kontrollerden sonra origin/turkish-content dalına gönderilir. Upstream değişiklikleri birleştirilir; force sync yapılmaz. Gerçek hesap işlemleri, herkese açık APK Release ve geliştiriciye mesaj/PR ayrı yetki gerektirir. Topluluk paylaşımı şu anda beklemede.

## Belgeler

- README.md: özellik ve güncel paket bağlantısı.
- docs/optional-translation-packages.md: dosya sözleşmesi ve kurulum.
- docs/turkish-synonym-transfer.md: hesap aktarımı ve geri alma.
- localization/ARAYUZ-CEVIRI-KAPSAMI.md: arayüz kapsamı ve inceleme sınırları.
- UPSTREAM-MERGE-2026-10-11.md: son upstream birleştirmesinin kontrol kaydı.

BUILD-ANDROID.ps1 kişisel ARM64 derlemesini yapar. Yerel SDK/JDK ve kısa derleme klasörü Git dışındadır. APK/kurulum teslimleri ana panel projesinin paylasim klasöründedir. Eski çalışma günlükleri ve gereksiz paket kopyaları ana projedeki temizlik arşivine alındı; canlı kaynak ağacında tutulmaz. Küçük v1/v2 test örnekleri geriye dönük uyumluluk için korunur. Genel proje tip denetimindeki hatalar bilinir; test sonucu bu denetimin tamamen geçtiği anlamına gelmez.
