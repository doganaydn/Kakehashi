# Kakehashi Türkçe — güncel çalışma özeti

Fork: https://github.com/doganaydn/Kakehashi · Dal: turkish-content.
Upstream: Portego-00/Kakehashi; 8ac088c güncellemesine kadar 12–16 Ekim düzeltmeleri birleştirildi.

- Kişisel Android sürümü: 1.5.0-tr.19 / code 44 / arm64-v8a.
- Uygulama kimliği: com.portego00.kakehashi.tr. Önceki kişisel imza ve kapalı upstream OTA korunur.
- Önceki tr.15 sürümü kullanıcı tarafından sorunsuz kullanılmıştı. tr.19 güncellemesinin telefon kontrolü henüz yapılmadı.
- Güncel dosya: translation-packages/wanikani-tr-v3.json, paket 1.5.0.
- 1–60 anlamları, 491 radikal, 1–15 seviyelerden 5.522 cümle ve kullanım açıklaması.
- Veri APK'ya gömülü değildir; Settings → Appearance üzerinden içe aktarılır.
- Seçimli eş anlam aktarımı ve geri alma açık kullanıcı onayı gerektirir; otomatik aktarım yok.
- Kullanıcı isteğiyle arayüz yerelleştirmesi aktif daldan kaldırıldı; İngilizce arayüz ve Türkçe öğrenme paketiyle devam ediliyor. Deneme kodu ui-localization-experiment-tr17 dalında saklandı. UI çeviri çalışması şu an aktif değil.

## Çalışma kuralları

Tamamlanan uygulama değişiklikleri kontrollerden sonra origin/turkish-content dalına gönderilir. Upstream değişiklikleri birleştirilir; force sync yapılmaz. Gerçek hesap işlemleri, herkese açık APK Release ve geliştiriciye mesaj/PR ayrı yetki gerektirir. Topluluk paylaşımı şu anda beklemede.

## Belgeler

- README.md: özellik ve güncel paket bağlantısı.
- docs/optional-translation-packages.md: dosya sözleşmesi ve kurulum.
- docs/turkish-synonym-transfer.md: hesap aktarımı ve geri alma.
- localization/ARAYUZ-CEVIRI-KAPSAMI.md: arayüz kapsamı ve inceleme sınırları.
- UPSTREAM-MERGE-2026-10-11.md: son upstream birleştirmesinin kontrol kaydı.

BUILD-ANDROID.ps1 kişisel ARM64 derlemesini yapar. Yerel SDK/JDK ve kısa derleme klasörü Git dışındadır. APK/kurulum teslimleri ana panel projesinin paylasim klasöründedir. Eski çalışma günlükleri ve gereksiz paket kopyaları ana projedeki temizlik arşivine alındı; canlı kaynak ağacında tutulmaz. Küçük v1/v2 test örnekleri geriye dönük uyumluluk için korunur. Genel proje tip denetimindeki hatalar bilinir; test sonucu bu denetimin tamamen geçtiği anlamına gelmez.

- Upstream PR #117: https://github.com/Portego-00/Kakehashi/pull/117 · optional-translation-packages dalında, bu geri dönüşten etkilenmedi.
