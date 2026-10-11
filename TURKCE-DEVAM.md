# Kakehashi Türkçe — kişisel Android denemesi

Kaynak sürüm: 69244d9747325c04ae70694f96053ecc376672bc (10 Ekim 2026).
Ana proje: https://github.com/Portego-00/Kakehashi
Yerel dal: turkish-content. Ana proje uzak bağlantısı: upstream.
GitHub fork: https://github.com/doganaydn/Kakehashi
Uzak bağlantılar: origin = kişisel fork, upstream = Portego-00/Kakehashi.
11 Ekim 2026: Fork doğrulandı; origin bağlandı. Türkçe paket desteği, bağımsız test verileri ve İngilizce açıklamalar turkish-content dalına gönderildi. main dalı upstream temelinde korundu.
Dal: https://github.com/doganaydn/Kakehashi/tree/turkish-content
111 ilgili test geçti; tam proje tip kontrolündeki önceki hatalar devam ediyor. APK release yayını ve ana geliştiriciye PR yapılmadı.

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

10 Ekim 2026: Android release derlemesi tamamlandı. APK adı Kakehashi-Turkce-1.4.8-tr.1-arm64.apk; teslim klasörü üst projedeki paylasim/kakehashi-tr-android. Boyut 128.905.943 bayt; SHA-256 dde5c27e362183ec57e1c0e047c9e788f1ba58f91f030ef6c277401d1641ddcc. APK imzası v2 doğrulandı; uygulama kimliği com.portego00.kakehashi.tr, ad Kakehashi Türkçe, min Android API 24, hedef API 36, yalnız arm64-v8a. Derlenmiş pakette Türkçe veri ve editorial-reviewed durumu mevcut. Expo OTA kapalı ve kakehashitr şeması doğrulandı. Fiziksel telefon testi kullanıcıyla yapılacak. Kurulum yönergesi ve yapı kanıtı aynı teslim klasöründe.

上げる (2490), まだ (9208), 改まる (4204), 宜しく (6338), 庄園 (7040), 升 (8599) ve kanji 一 (440). Türkçe anahtarı kapatıp aç; İngilizce kaynağı aç; çeviri gizleme ayarını dene. Paket dışında bir kelimede İngilizceye dönüşü kontrol et. Ders/tekrar açıklama ekranları ve uzaktan içerik güncellemesi sonraki kapsamdır.


## 10 Ekim 2026 — Kakehashi Türkçe: seviye 8 entegrasyonu

Kullanıcının yeni isteğiyle uygulama çalışması yalnız mevcut seviye 8 içeriğini kişisel Android sürümüne eklemek için yeniden açıldı. kakehashi-seviye08-aktar.py güncel kaynağa ve sürüme bağlı kontrollerden sonra 133 kelime/409 cümleyi dışa aktarıyor; ana çeviri dosyasına yazmıyor. Önceki pilot korunuyor: pakette 151 anlam, 438 kontrollü ve 3 gösterilmeyen demo cümle var. Kelime ayrıntı ekranında Türkçe çeviri ve hedef kullanım; özgün İngilizceyi açma ve çeviriyi gizleme mevcut. Ders/tekrar ekranı genişletilmedi.

Galaxy A55 ARM64 APK 1.4.8-tr.2, versionCode 20 üretildi. Aynı com.portego00.kakehashi.tr kimliği ve önceki APK ile aynı imza doğrulandı; mevcut kişisel kurulumun üzerine güncellenebilir. 53 test geçti; derlenmiş pakette 409 seviye 8 kayıt parmakizi bulundu. Teslim: paylasim/kakehashi-tr-android/seviye-08; APK, KURULUM.md, içerik ve yapı manifestleri burada. Fiziksel telefon doğrulaması kullanıcıda. Yerel geçmiş planlar saklandı, kullanıcı onayı veya WaniKani gönderimi yapılmadı; ana çeviri dosyası aynı. Çeviri işinin sonraki önceliği seviye 1–7; yeni içerik kontrolü tekrar uygulanmadı.


## 10 Ekim 2026 — Kakehashi Türkçe arayüz düzenlemesi

1.4.8-tr.3 / versionCode 21: Türkçe kelime anlamlarının her sözcüğünün ilk harfi tr-TR kurallarıyla büyütülür; i→İ ve ı→I korunur. Bu yalnız görüntüleme dönüşümüdür, ana çeviri verisi değişmez. Alternatif anlam etiketinin yeni metni Türkçe:. Türkçe öğrenme içeriği ayarı, diğer Appearance satırlarının 16px yatay boşlukları, simge, esneyen metin ve sağ anahtar düzeniyle hizalandı; eski 21 anlam/35 örnek açıklaması kaldırıldı. Ortak ayar denetleyicisini içeri aktarmadan aynı görünüm uygulanır.

58 ilgili test ve hedefli kod kontrolü geçti. Seviye 8 içeriği önceki sürümle aynı; onay/gönderim değişmedi. Fiziksel telefondaki görünüm kullanıcı tarafından doğrulanacak. APK ve kurulum yönergesi paylasim/kakehashi-tr-android/seviye-08 içinde tutulur.


## 11 Ekim 2026 — Kakehashi Türkçe: dosyadan öğrenme paketi

Kullanıcının onayladığı plan uygulandı: ayarlarda Çeviri dosyası yükle → özet → Bu paketi kullan; çevrimdışı yerel kayıt, yeniden açınca geri yükleme ve Uygulamayla gelen içeriğe dön. Yüklenen paket tüm gömülü paketin yerine geçer; eksik kaynaklar İngilizce. Kanji/kelime ekranları etkin paketi takip eder. Veri yapısı sürüm 2 görsel radikallerde null yazılışı destekler; radikal ekranı ve gerçek radikal çevirileri ileride, ilk pakette radikal yok. Menü dili ve cevap kabulü değişmez; hesap/gönderim/çeviri ana kayıtlarına yazmaz.

Dışa aktarım aracı kakehashi-dil-paketi-hazirla.py --levels 8. İlk ayrı JSON paylasim/kakehashi-tr-dil-paketleri/wanikani-tr-seviye-08.json: 34 kanji, 127 vocabulary, 6 kana_vocabulary, 409 kontrollü cümle. 8. seviye ana çeviri parmakizi korundu. Paket şeması ve manifest, kurulum yönergesi aynı klasörde. Kakehashi-tr/DIL-PAKETI-PLANI.md uygulama sözleşmesi ve gelecek aşamaları içerir. Eski v1 paketleri kanji/kelime için kabul edilir; radikaller v2 gerektirir. Biçim kontrolü çeviri doğruluğu veya bağımsız uzman onayı değildir.

71 ilgili test geçti: gerçek paket, dosya seçici/iptal/büyük dosya, etkinleştirme önizlemesi, kanji/kelime, bozuk önbellek, başarısız kayıtta önceki paketi koruma, yeniden açma ve geri dönüş. Hedefli kod kontrolü geçti. Genel tip kontrolünün önceki proje hataları sürüyor; Türkçe modülünde hata yok. Fiziksel telefon görünümü/dosya seçimi/çevrimdışı test kullanıcıyla yapılacak. Yeni kişisel ARM64 sürüm 1.4.8-tr.4, versionCode 22; önceki uygulamayı kaldırmadan güncelle. APK teslim klasörü paylasim/kakehashi-tr-android/dil-paketi.


## 11 Ekim 2026 — genel çeviri paketi arayüzü İngilizce

Kullanıcı, uygulama arayüzünün bütünüyle İngilizce kalmasını ve yalnız dil verilerinin hedef dilde olmasını istedi. Kişisel sürüm 1.4.8-tr.5 / versionCode 23: Optional translation package, Import translation file, Use this package, Restore bundled content. Paket özetleri, dosya/kayıt hata mesajları ve erişilebilirlik etiketleri İngilizce. Kelime ekranında English:, Translation:, Show original English / Hide original English. Türkçe anlamlar, cümleler ve kullanım notları değişmedi. Bu, genel arayüz metni düzenlemesidir; mevcut prototipin doğrulayıcısı hâlâ Türkçe paketleri destekler, diğer dilleri desteklediği iddia edilmez.

8. seviye JSON paketinin adı da İngilizce metadata olarak düzenlendi; sürümü 1.0.1, içerik aynı. Önceki telefonda yüklenen paket kendiliğinden değiştirilmez; İngilizce paket adı için dosya yeniden seçilip etkinleştirilir. 71 test ve hedefli kod kontrolü geçti. Ana çeviri dosyası ve hesap/onay/gönderim davranışı aynı.


## 11 Ekim 2026 — birleşik paket ve öğrenme ekranları

Kakehashi 1.4.8-tr.6 (24), arm64 APK hazır; önceki sertifika doğrulandı. Lessons tek sayfa/sekmeli görünümü, ilgili kelime kartları, kanji okunuş örnekleri ve Review anlam açıklaması aktif paketi kullanır. Cümle çevirisi, kullanım açıklaması ve açılabilir İngilizce kaynak ayrı tutulur. UI İngilizce. Cevap değerlendirmesi değiştirilmedi; Türkçe cevap kabulü ayrı kullanıcı kararıdır.

Birleşik test dosyası: paylasim/kakehashi-tr-dil-paketleri/wanikani-tr-01-60-seviye08-cumleler.json. 2.101 kanji + 6.757 vocabulary + 60 kana_vocabulary = 8.918 anlam; seviye 8 için 409 cümle. SHA256 a6bc1c0f56dac5c6801cb526eb63533e5fa0c9fe328c05fa1c30dcb6f0c95040. Dışa aktarım manifestindeki eski hash güncel dosyaya göre düzeltildi. Ana çeviri/kontrol dosyaları değiştirilmedi, hazır kontroller yeniden uygulanmadı; kullanıcı onayı ve WaniKani gönderim durumu değişmedi, gönderim başlatılmadı.

257 test / 12 grup geçti; APK derlemesi, sürümü ve imzası doğrulandı. Genel TypeScript kontrolünde mevcut proje hataları sürüyor; değişen üretim modüllerinde yeni hata yok. AsyncStorage kapasitesi 64 MB; tam birleşik paketin kalıcı kayıt ve yeniden yükleme testi geçti. Fiziksel telefonda tr.6 testi bekliyor. Kurulum: paylasim/kakehashi-tr-dil-paketleri/KURULUM.md.


## 11 Ekim 2026 — mobil radikal ekranı ve 9. seviye cümleleri

Kullanıcı isteğiyle 1.4.8-tr.7 (25), arm64-v8a APK hazırlandı. Radikal ayrıntı ekranının başlığı, Name/Primary alanı ve sabit başlığı etkin çeviri paketini kullanır; English: özgün ad ve varsa Translation: alternatifler gösterilir. Found In Kanji kartları Türkçe anlamları gösterir. Kaynak okunuşları ana ayrıntı hazırlığında da taşınır; ID/tür/yazılış/anlam/okunuş eşleşmesi gevşetilmedi. Ders/tekrar gömülü ayrıntı ekranı aynı bileşenle güncellenir. Kart yüksekliği metin için esner. Dil kapalı, paket kaldırılmış veya kaynak değişmişse İngilizce. UI İngilizce, Türkçe büyük harf biçimi önceki tercihle aynı. Cevap değerlendirmesi ve hesap gönderimi değiştirilmedi.

Yeni JSON: paylasim/kakehashi-tr-dil-paketleri/wanikani-tr-01-60-seviye08-09-cumleler-radikaller.json; sürüm 1.2.0, 9.409 konu, 857 cümle (8:409, 9:448), 6131237 bayt, SHA256 8506a1a2b6ac3610d005f35f72f3bd7dbd0f8100865f2c43dcdf76e360a4d22c. Radikal/kanji/kelime anlamları ve 8. seviye örnekleri önceki paketle aynı; yalnız 9. seviye 448 kontrollü örnek eklendi. Önceki JSON ve APK korunur. APK tek başına bu yeni tam paketi gömmez; güncellemeden sonra JSON ayrıca içe aktarılır.

66 ilgili test geçti: gerçek 491 radikal/2.101 kanji kaynak eşleşmesi, 857 örnek, eski içerik karşılaştırması, parçalı kayıt ve yeniden açma, gerçek radikal bileşeni gösterimi, dil/paket değişimi ve değişen kaynakta geri dönüş. APK derlendi; uygulama kimliği, 25 kodu, arm64-v8a ve önceki sertifikayla aynı imza doğrulandı. Genel tip kontrolünde önceki proje hataları sürüyor; değişen modüllerde hata yok. Hedefli lint sıfır hata, eski useMemo uyarısı. Fiziksel telefon kontrolü kullanıcıda. Ana çeviri ve ikinci kontrol kayıtları korundu; kullanıcı onayı/gönderimi başlatılmadı.


## 11 Ekim 2026 — Composition radikal adları

1.4.8-tr.8 (26), arm64-v8a: KanjiDetails Composition radikal kartları, açılan radikal hatırlatıcısının başlığı ve erişilebilirlik etiketleri etkin çeviri paketine bağlı. Paket/dil değişimi anında yansır; kaynak eşleşmesi kontrolleri aynı, İngilizce mnemonic metni değişmez. 23 ilgili test geçti (Composition bileşeni, dil kapatma, radikal ekranı, kaynak değişimi, paket kayıt/yeniden açma ve konu sayfası). Derleme ve önceki sürümle aynı imza doğrulandı. Fiziksel telefon testi kullanıcıda. JSON değişmedi; kullanıcı tarafından wanikani-tr.json olarak adlandırılmış, SHA önceki teslimle aynı. Yeni APK için aynı etkin paket kullanılabilir. UI düzenlemesi henüz uygulanmadı; öncelik önerileri anlam kartı tekrarları, alt alta etiket/değer düzeni, kısa paket özeti, daha kompakt başlık. UI İngilizce kalır.


## 11 Ekim 2026 — Primary/Alternative satır içi çeviri

Kullanıcının onayladığı düzen: 1.4.8-tr.9 (27), arm64-v8a APK. Kelime/kanji/radikal ayrıntı Name bölümünün mevcut Primary ve Alternative satırlarında Türkçe; Show original English ile İngilizce aynı Text alanında soluk ve ayraçlı, Hide original English ile gizlenir. Boş Türkçe alternatifte gereksiz satır yok; kullanıcı açarsa özgün alternatif aynı satırda gösterilir. Ayrı English:/Translation: blokları kaldırıldı. Ders tek sayfa ve sekmeli ekranları aynı gösterimi kullanır; tekrar eden özgün alternatif kartları çeviri aktifken gizlidir. Renkler, başlık, sekmeler, kişisel eş anlamlılar, cümle gösterimi ve kaynak kontrolü korunur. Çevirisiz veya kapalı dilde İngilizce. Türkçe büyük harf biçimi öncekiyle aynı.

63 ilgili ekran ve satır testi geçti; hedefli lint sıfır hata, 5 mevcut uyarı. APK derlemesi, uygulama kimliği, 27 sürüm kodu, arm64-v8a ve önceki imzayla eşleşme doğrulandı. Fiziksel telefon görünümü kullanıcıda. Yeni JSON gerekmez; etkin wanikani-tr.json ve ana çeviri dosyaları aynı. Cevap değerlendirme, hesap onayı ve WaniKani gönderimi değiştirilmedi.


## 11 Ekim 2026 — İlgili konular ve Items çeviri gösterimi

1.4.8-tr.10 (28), arm64-v8a: Kelimelerin Composition kanjileri, kanjilerin Visually Similar Kanji kartları, Choose Lessons List View ve Items (Recent Unlocks, Critical, Burned ve View All listeleri) etkin dil paketinin Türkçe birincil anlamını kullanır. Ders/Items listelerinde orijinal anlam düğmesi yoktur; özgün tasarım ve İngilizce UI korunur. İlgili kanjilerde tam kaynak okumaları taşınır. Özet Items kayıtları tam orijinal yerel konu önbelleğiyle doğrulanır; paket kaynak kontrolü gevşetilmez. Eksik/eşleşmeyen/kapalı çeviride İngilizce gösterilir.

65 ilgili test geçti. Yeni APK derleme ve imza sonuçları BUILD-MANIFEST-tr.10.json dosyasında; fiziksel telefon testi kullanıcıda. Kullanıcının wanikani-tr.json dosyası değişmedi, yeniden içe aktarım gerekmez. Cevap değerlendirme ve WaniKani gönderimi değiştirilmedi.


## Kalıcı kullanıcı tercihi — fork üzerinden geliştirme (11 Ekim 2026)

Kullanıcı bundan sonraki tüm geliştirmelerin kendi GitHub fork’una push edilerek ilerlemesini açıkça istedi. Yetkili hedef: origin = https://github.com/doganaydn/Kakehashi.git, çalışma dalı turkish-content. Tamamlanan değişiklikler uygun kontrollerden sonra commit edilip bu dala push edilir; her seferinde yeniden gönderim izni sorulmaz. upstream = Portego-00/Kakehashi yalnızca ana proje güncellemelerini almak için kullanılır. main temel dal olarak korunur. Hesap bilgileri, özel anahtarlar, yerel araçlar ve derleme günlükleri paylaşılmaz. Bu tercih WaniKani gönderimi, geliştiriciye mesaj/PR, APK Release veya mağaza yayını için otomatik yetki oluşturmaz. Panel/çeviri ana projesi bu Kakehashi fork’una topluca taşınmaz; fork’un kapsamına uygun mobil geliştirmeler ve gerekli paket kopyaları gönderilir.


## 11 Ekim 2026 — Seçimli Türkçe synonym aktarımı

1.4.8-tr.11 (29): Settings → Appearance → Add Turkish synonyms to WaniKani. Tek/çoklu seviye veya aralık, radikal/kanji/kelime ve çalışma durumu seçilir; varsayılan mevcut seviye ve çalışılan konular. Önizlemede konu veya tek karşılık çıkarılabilir. Mevcut karşılıklar korunur; Türkçe harf ve büyük/küçük harf eşdeğerleri tekrar eklenmez. Son hesap/kapsam onayından önce gönderim yok. Rastgele içe aktarılan gösterim JSON’u gönderim kaynağı değildir; uygulamanın kontrol edilmiş kataloğu kullanılır. Japonca okunuş değerlendirmesi ve cevap motoru değiştirilmedi; mevcut Accept User Synonyms ayarı geçerli.

İşlem duraklatılabilir ve açık onayla sürdürülebilir. Cihazdaki hesap bazlı geçmiş yalnızca bu işlemin sunucuda doğrulanmış eklemelerini geri alır; belirsiz gönderimler otomatik silinmez. Geri alma kesilirse eklemeye dönmez. Ekranı açmak/önizlemek/geçmişi yüklemek otomatik gönderim başlatmaz. API çağrıları çevrimiçi kaynak/durum ve güncel materyallerle doğrulanır; mevcut düzenleyicilerle aynı sıralı yazıcı kullanılır. Büyük seçimlerde sorgular parçalara ayrılır. Ayrıntı: docs/turkish-synonym-transfer.md. Fiziksel telefon kontrolü kullanıcıda; geliştirme doğrulamasında gerçek hesaba aktarım yok. Çeviri ana dosyaları ve wanikani-tr.json değişmedi.

158 test / 18 grup geçti; hedefli lint sıfır hata. Genel tip kontrolünde önceki proje hataları sürüyor; değişen modüller ayrıca kontrol edildi. Yeni APK teslim ve imza kaydı BUILD-MANIFEST-tr.11.json içinde tutulacak.

tr.11 APK derlendi; 29 sürüm kodu, arm64-v8a, önceki sertifikayla aynı imza ve derleme kaynak kopyası doğrulandı. 158/158 test geçti. Ana JSON SHA aynı. BUILD-MANIFEST-tr.11.json teslim kaydı tamamlandı.


## 11 Ekim 2026 — Eski demo kaldırıldı; kısa aktarım önizlemesi

Kullanıcı tr.11 için toplu aktarım, pause, uygulamayı kapatıp yeniden açtıktan sonra açık Continue/Resume ile devam ve geri alma işlemlerini telefonda başarılı bildirdi. Bu sonuç kullanıcı testi olarak kaydedildi; geliştirici gerçek hesap aktarımı yapmadı.

tr.12 (30): Eski tr-learning-pilot gösterim paketi uygulamadan çıkarıldı ve yalnız test fixture olarak korundu. Paket yüklenmemişse İngilizce; Remove translation package çeviri dosyasını cihazdan kaldırır, hesaba dokunmaz. Yüklenmiş etkin JSON korunur. Synonym önerileri için tam uygulama kataloğu ayrı olarak kalır; rastgele içe aktarılan gösterim JSON’u hesaba yazma kaynağı değildir.

Önizlemede yeni karşılığı olmayan konular varsayılan gizli, isteğe bağlı açılır. Seviye filtresi ve 30 konuluk sayfalama var; seçimler tüm seviyeler/sayfalar boyunca korunur. Konuyu işaret dışına almak görünümden çıkarmaz. Yalnız ulaşılmış seviyeler gösterilir, From/To alanları etiketli. 161 test / 18 grup geçti; hedefli lint sıfır hata. tr.12 fiziksel görünüm kontrolü kullanıcıda.


## 11 Ekim 2026 — Review Complete ve Subject List çevirileri

tr.13 (31): Review Complete sonuç kartlarının anlamları ve yazısız radikal metin karşılığı etkin içe aktarılmış çeviri paketinden çözülür. Subject List Browse/Manage ve konu ekleme listelerindeki anlamlar, erişilebilirlik adları ve metin tabanlı radikal gösterimi aynı pakete bağlı. Subject Lists ana ekranında yazısız konu önizlemesi de çeviriyle gösterilir. Kaynak doğrulaması, İngilizceye geri dönüş, mevcut tasarım, Japonca okumalar ve gizli cevapları açma davranışı korunur. Hesap synonyms/cevap değerlendirme/gönderim davranışı değişmez. Çoklu dil ve yüklenen JSON’dan aktarım önerisi alma bu değişiklikte yapılmadı; sonuncusu sonraki işlem için ertelendi. Fiziksel tr.13 ekran kontrolü kullanıcıda.

172 test / 20 grup geçti; hedefli lint sıfır hata/uyarı. Genel tip kontrolünde önceki proje hataları var; değişen üretim modüllerinde hata raporlanmadı. tr.13 APK derlendi; 31 kodu, arm64-v8a, önceki sertifikayla aynı imza ve derleme kaynak kopyası doğrulandı. Ana JSON SHA aynı. Teslim kaydı BUILD-MANIFEST-tr.13.json.


## 11 Ekim 2026 — Tek JSON, sade ayarlar ve APK temizliği

tr.14 (32): Kullanıcı tek dosyalı çalışma ve ayar alanının sadeleştirilmesini onayladı. Tam katalog statik importu kaldırıldı; uygulamada gömülü Türkçe katalog/demo yok. Format v3 wanikani-tr-v3.json hem gösterim hem ayrı synonymAnswers.values alanı üzerinden öneri sağlar. v1/v2 eski dosyalar gösterim için çalışır, aktarıma izin vermez; geçmişteki sahipliği kaydedilmiş eklemeler dosyasız da geri alınabilir. Yeni dosya mevcut kontrol edilmiş karşılıklar/cümleleri aynen korur, ayrı aktarım alanı ekler; yeni dilsel kontrol iddiası yok. Ana v2 dosyası değiştirilmedi. Paket değişimi önizlemeyi geçersiz kılar ve yeni eklemeleri durdurur; açık son onay ve kaynak kontrolü korunur.

Ayarlar kısa paket özeti, açılır Package details, 1–60 gibi seviye aralıkları ve kısa açıklamalar kullanır. Kullanıcı fotoğrafındaki uzun ad/60 seviye listesi varsayılan görünümden çıkarıldı.

APK artışında eski içerik hashli DOM dosyalarının birikmesi doğrulandı. BUILD-ANDROID yalnız doğrulanmış staging/generated/assets/react/release klasörünü temizler; Gradle yeni DOM .map hata ayıklama dosyalarını paketleme öncesi çıkarır. Çalışan WebView HTML/JS/CSS varlıkları korunur. Gerçek hesaba aktarım yapılmadı. Yeni APK ve format v3 dosyası birlikte yüklenecek. 176 test /20 grup geçti; fiziksel yeni sürüm kontrolü kullanıcıda.

tr.14 APK 185,19 MiB →119,24 MiB; yaklaşık 65,95 MiB küçüldü. Üç DOM sayfasının HTML kaynakları APK içinde doğrulandı; DOM .map dosyası sıfır, eski katalog id native bundle içinde yok. Aynı imza, 32 kodu ve arm64 doğrulandı. 176/176 test geçti; hedefli lint sıfır hata/uyarı. Genel tsc eski proje hataları nedeniyle başarısız; değişen üretim modüllerinde hata raporlanmadı. 9409 konu/857 cümlenin kaynak/anlam/örnek içerikleri v2 ile birebir korundu; yeni JSON 7,19 MiB. Fiziksel yeni sürüm kontrolü kullanıcıda.
