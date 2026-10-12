# Arayüz çeviri kapsamı — 12 Ekim 2026

Amaç: Tasarımı değiştirmeden uygulamanın kendi metinlerini ileride Türkçeleştirmek. Bu teslim kaynak metin envanteridir; uygulamada dil değişimi henüz etkin değildir. Öğrenme içeriklerinin wanikani-tr-v3.json paketi bundan ayrıdır.

## Bütün alanların listesi

Her kaynak dosyasının tek tek durumu, sıfır aday içeren dosyalar dahil, [tam dosya listesinde](source/COVERAGE.md) bulunur. Kapsam yalnız Android'e göre daraltılmadı.

| Alan | Çeviri kapsamı |
|---|---|
| Açılış ve gezinme | Yükleme, sekmeler, More, geri/kapat, ekran başlıkları, bağlantı yönlendirme |
| Giriş ve hesap | WaniKani giriş, API anahtarı açıklamaları, geçerlilik/hata, çıkış ve bağlantılar |
| Ana ekran | Ders/tekrar kartları, sayaçlar, seri, kritik öğeler, ilerleme ve özelleştirme |
| Ders seçimi | Choose Lessons, grid/list, seviye/tür filtreleri, seçim, sıralama, toplu işlem, devam |
| Dersler | Radikal/kanji/kelime sekmeleri, anlam/okunuş/bağlam, ses ve tamamlama |
| Tekrarlar | Soru türü, cevap, doğru/yanlış, ipucu, düzeltme, atlama, not ve oturum işlemleri |
| Tekrar sonucu | Review Complete, istatistik, listeler, devam/bitir ve özet |
| Özel çalışma | Custom Lessons/Reviews, karma tekrar, son dersler, özel seçim ve ön ayarlar |
| Konu detayları | Primary/Alternative, okunuş, composition, benzer kanji, not, eş anlam, ilerleme ve kullanım başlıkları |
| Listeler | Items, Subject List, oluşturma/düzenleme, arama, filtre ve sıralama |
| SRS ve seviyeler | Aşamalar, dağılım, burned, unlocks, kritik öğeler ve seviye ekranları |
| İlerleme ve analiz | Grafikler, karşılaştırma, tahmin, çalışma süresi, etkinlik kategorileri, hedef/tempo ve seviye özeti |
| Alıştırma ve oyunlar | JLPT, Wordle, kelime arama, bulmaca, benzer kanji, kana/kanji, anlam/okunuş, hiragana |
| Yazma | Oturum ayarları, serbest çizim, çizgi/sıra, sonuç ve geri bildirim |
| Dinleme | Anime seçimi, sesli kelime, dinleme ve bağlam cümlesi alıştırmalarının kontrolleri |
| Haber | Kütüphane, kaydetme, filtre, kolay/standart seçim, okuyucu ve hatalar |
| EPUB | Kitap kütüphanesi, içe aktarma, okuyucu, yer imi, seçim ve ayarlar |
| Manga | Kütüphane, içe aktarma, sayfa/okuma, OCR ve mesajlar |
| Şarkı ve müzik | Şarkı/çalma listesi, söz ekranı kontrolleri, oynatma ve bağlantı |
| Video | Video listeleri, YouTube arama/oynatıcı, Mux ve uygulamanın oynatıcı kontrolleri |
| Not defterleri | Defter/sayfa, uygulamanın yazdığı düzenleyici araçları, el yazısı, dışa aktarma ve uyarılar |
| Metin ve URL | Arama/okuma, geçmiş/sonuç, URL okuyucu, seçili kelime ve çevirici kabuğu |
| Kamera ve ses | OCR/sonuç, konuşma arama/sonuç/geçmiş, mikrofon ve tanıma açıklamaları |
| Geliştirici ekranları | Anime transcript, ASR debug ve test oturumu ekranlarının kullanıcıya gösterdiği metinler |
| Bunpro | Uygulamanın yazdığı bağlantı, ana ekran, arama, ders/tekrar, analiz ve ayarlar |
| Anki | Uygulamanın yazdığı ayarlar, dışa aktarma, erişim, kart türü ve sonuç mesajları |
| Topluluk ve destek | Geri bildirim, özellik isteği, sorun listesi/detayı, yeni sorun, destek ve katkı |
| Sürüm bilgisi | What's New, güncelleme notları ve uygulama yardım metinleri |
| Genel ayarlar | Kategoriler, arama, hızlı gezinme, açılır ayrıntı, gelişmiş seçenek ve seçiciler |
| Görünüm | Tema, renk, metin boyutu, sekme, ana ekran ve widget özelleştirmesi |
| Öğrenme ayarları | Ders/tekrar sırası, ön ayar, cevap modu, kanji çizimi, bağlam ve okunuş |
| Medya/bağlantı ayarları | Ses, müzik, Spotify/Apple Music, haber/okuma ve Immersion Kit kabuğu |
| Veri/bakım | Önbellek, depolama, eşitleme, dışa aktarma, API/bağlantı hata ve bakım seçenekleri |
| Çeviri paketi | İçe aktarma, etkinleştirme/kaldırma, özet/ayrıntı, biçim hatası ve özgün metni gösterme |
| Eş anlam aktarımı | Seviye/tür/durum, önizleme/onay, toplu seçim, duraklat/devam, geçmiş, geri alma ve çakışma |
| Ortak durumlar | Alert/onay, başarı/hata, boş/yükleme/çevrimdışı, form doğrulama ve düğmeler |
| Erişilebilirlik | accessibilityLabel/Hint, ekran okuyucu ve web aria etiketleri |
| Bildirimler | Kanal adı, ders/tekrar hatırlatıcısı, başlık/gövde ve yerel Android bildirim kodu |
| Android widget | Küçük/orta widget adı, açıklama, tekrar/kritik/seri, eşitleme ve boş durum |
| iOS/watch | iOS widget/Live Activity, Apple Watch soru/cevap/oturum/istatistik, paylaşım uzantısı ve izin açıklamaları |
| Web | Mobil karşılıkların yanında web menü, modal, seçim, kısayol ve yardımcı mesajlar |
| Backend | Birinci taraf sunucu hata/işlem mesajları; kullanıcıya ulaşması ayrıca kontrol edilecek adaylar |
| Tanıtım sitesi | website kaynakları ayrı yüzeyde listelendi; mobil uygulama için zorunlu değil |

## Dosyalar

- [source/en.json](source/en.json): Görünür UI olma olasılığı yüksek kaynak metinler. İlk çeviri aday dosyası; elle ayıklama gerekiyor.
- [source/review-needed.en.json](source/review-needed.en.json): Kullanıcıya gösterilip gösterilmediği kesinleşmeyen bütün adaylar. Silinmediler; incelenmeden envanter yüzde yüz tamamlandı sayılmaz.
- [source/COVERAGE.md](source/COVERAGE.md): Taranan her dosyanın listesi.
- [source/files.json](source/files.json): Parmak izi, yüzey, aday sayısı veya kapsam dışı gerekçesi.
- source/occurrences.json.gz: Kaynak dosya, satır, sınıf, bağlam ve değişkenler; gzip ile sıkıştırılmış JSON.
- [source/dynamic-rules.json](source/dynamic-rules.json): Birleştirilmiş/üretilmiş metin, tarih-sayı, çoğul, erişilebilirlik ve bildirim mantığı için kontrol konumları.
- [source/native-format-review.json](source/native-format-review.json): Swift/Kotlin/yerel format dönüşümü gerektiren adaylar.
- [source/manifest.json](source/manifest.json): Tarama sürümü ve sayılar.
- [source/parse-diagnostics.json](source/parse-diagnostics.json): Kaynak okuma sorunları; teslim taramasında boş.

Anahtarlar dosya adı ve kaynak metin parmak izinden üretilir; satır kayınca değişmez. Aynı dosyadaki aynı metin bir anahtarda toplanır; anlam bağlamları gerekirse ayrılacak. `{value1}` yer tutucudur; gerçek ifade occurrences kaydında korunur. Çoğul ifadeler henüz dil kurallarına dönüştürülmedi. Türkçe çalışma dosyası bu aşamada oluşturulmadı.

## Kapsam dışı ve sınırlar

WaniKani/Bunpro anlamları, mnemonikleri, örnek cümleler, haber, şarkı sözleri, manga/kitap/video içerikleri, sözlük/JLPT referansları, kullanıcı notları ve API cevap içerikleri ayrı öğrenme içeriğidir. Bu servislerle ilgili uygulamanın kendi düğme ve açıklamaları ise dahildir.

Üçüncü taraf kütüphanenin kendi arayüzü, işletim sisteminin dosya seçicisi/izin düğmeleri ve dış giriş sayfası uygulama kaynak dosyasından çevrilemez. Uygulamanın izin isteme açıklamaları dahildir. Test/fixture, font, ikon geometrisi, medya, build metadatası ve dış referans verileri files.json içinde gerekçeleriyle yer alır.

Görsellere gömülü yazılar, dinamik veri/enum adlarından türetilen metinler ve bütün çalışma zamanı durumları literal taramasıyla kesinleştirilemez; ekran geçişleriyle son kontrol gerekir. Sayılar doğrulanmış çeviri sayısı değil, kaynak aday sayısıdır. Kararsız listedeki teknik adlar çevrilmemelidir.

## Sonraki aşama

1. UI ve kararsız adayları kaynak bağlamıyla ayıklamak.
2. Ortak anahtarlar, çoğul/tarih/sayı ve değişken sözleşmesini kesinleştirmek.
3. Gözden geçirilmiş İngilizce dosyadan tr.json oluşturmak; eksikte İngilizceye dönmek.
4. Arayüz dilini öğrenme içeriğinin dilinden ayrı tutmak; ekranları dil dosyasına bağlamak.
5. Android/iOS/web/native ekranları, hata/boş durumları ve erişilebilirliği gerçek kullanımda kontrol etmek.

Bu teslim envanter hazırlığıdır. APK, tasarım, öğrenme paketi ve WaniKani hesabı değiştirilmedi. Envanteri çıkarmak uygulamayı henüz bu JSON'dan metin okuyacak hâle getirmez.
