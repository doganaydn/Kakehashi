# Android arayüz yerelleştirmesi

İngilizce varsayılandır. Android'de **Settings → Appearance → App language → Türkçe** ile arayüz dili değişir. Tercih cihazda saklanır. Öğrenme içeriği paketi, kullanıcı eş anlamlıları ve cevap değerlendirmesi ayrı çalışır. Arayüzü Türkçe yapmak için öğrenme paketi yüklemek gerekmez.

## Kaynaklar ve kapsam

- `src/features/interface-language/locales/en.json`: çalışan arayüzün İngilizce kaynakları.
- `src/features/interface-language/locales/tr.json`: Türkçe karşılıklar.
- `android/app/src/main/res/values*/strings.xml`: uygulamaya ait yerel hata mesajları.
- `modules/home-widget/android/src/main/res/values*/strings.xml`: Android widget kaynakları.
- `android-bindings.json`: güncel `uiT` çağrılarının dosya/satır bağlantıları; kaynak düzenlemek için kullanılmaz.
- `android-translation-review.json`: anahtar, değişken ve inceleme durumu. Anahtar sayısı ekran sayısı veya dilsel doğruluk ölçüsü değildir.
- `turkish-ui-overrides.json`: kaynak İngilizce metne göre tek tek düzeltilmiş karşılıklar.

Bağlanan alanlar arasında giriş, ana ekran, ders/tekrar, konu ayrıntıları, arama/listeler, ayarlar, istatistikler, çalışma araçları, ses/OCR, haber/kitap/manga araçları, not defterlerinin uygulamaya ait kontrolleri, sürüm notları, hata ve erişilebilirlik mesajları bulunur. Tarih/sayı yardımcıları seçilen arayüz dilini kullanır. İngilizce çoğul ekleri Türkçe sayaçlara eklenmez.

WaniKani/Bunpro öğrenme metinleri, Japonca, kullanıcı notları, kitap/haber/şarkı içerikleri, sunucudan gelen ham hata ayrıntıları ve üçüncü taraf editör kontrolleri bu arayüz kataloğuyla çevrilmez. Apprentice, Guru, Master, Enlightened ve Burned adları korunur. Web ve iOS için dil seçici eklenmedi.

## Davranış

`runtime.ts` çevrimdışı i18next kaynaklarını ve ayrı Zustand tercihini kullanır. Bileşenler dil değişikliğine abone olur; ekran ağacı dil adına göre yeniden oluşturulmaz. İşlem kimlikleri, filtre değerleri, API alanları ve doğru cevaplar çeviri anahtarı olarak kullanılmaz. `uiMessage` yalnızca bilinen arayüz metinleri için açık gösterim sınırlarında kullanılır; öğrenme metinlerine genel bir çeviri filtresi uygulanmaz.

Android dil tercihi ayrıca kimlik bilgisi içermeyen yerel tercihlerde saklanır. Uygulama kapalıyken çalışan widget görevleri dili buradan okur. Bildirim alıcısı gerçek bildirim gösteriminde güncel dili kullanır; bildirim kimlikleri ve planlanan zamanlar değişmez. Widget dil değişimi önbellekteki veriyi yeniden gösterir ve çalışma etkinliği kaydetmez. DOM not defteri ve Bunpro görünümlerine dil açık bir özellik olarak aktarılır.

## Kontrol ve kalan inceleme

```sh
node scripts/validate-interface-localization.cjs --write-report
```

Kontrol; İngilizce/Türkçe anahtar eşliğini, yer tutucuları, kaynak bağlantılarını, sözdizimini, DOM yönergesinin yerini ve çevrilmiş iç durum karşılaştırmalarını denetler. Düz JSX metni dışında kalan dinamik yollar için otomatik tarama tamlık garantisi vermez. Yeni bir ekran eklenirken görünür metinler ve hata yolları ayrıca gözden geçirilmelidir.

Türkçe katalogda AI ile hazırlanmış taslaklar bulunur. Sık kullanılan çalışma terimleri, hesap aktarım onayları, hata mesajları ve dinamik sayaçlar ayrıca düzenlendi; kataloğun tamamı bağımsız bir dil uzmanından geçmedi. Uzun açıklamalar ve geçmiş sürüm notlarının dilsel ikinci kontrolü sürmektedir. Bütün ekranların telefondaki görsel kontrolü henüz tamamlanmadı. Bu nedenle bu çalışma kişisel deneme sürümüdür; raporda bu aşamalar tamamlanmış gösterilmez.

Cihaz kontrolü sırası: dil değiştirip yeniden açma; açık ders/tekrarın ilerlemesi; büyük yazı ve koyu tema; öğrenme paketi açık/kapalı; bildirim ve üç widget türü; kitap/not defteri araçları. Gerçek hesaba eş anlamlı gönderme bu kontrolün zorunlu adımı değildir.

## Çeviri taslağı atfı

İlk Türkçe taslaklarda yerel olarak [Helsinki-NLP / OPUS-MT tc-big-en-tr](https://huggingface.co/Helsinki-NLP/opus-mt-tc-big-en-tr) kullanıldı; model kartındaki lisans CC BY 4.0'dır. CTranslate2 dönüşümü: [ooeoeo/opus-mt-tc-big-en-tr-ct2-float16](https://huggingface.co/ooeoeo/opus-mt-tc-big-en-tr-ct2-float16). Model ağırlıkları ve üretim araçları APK'ya veya Git deposuna eklenmez. Son metinler için düzeltme ve inceleme kaydı yukarıdaki dosyalardadır.

Model yayını: Jörg Tiedemann ve Santhosh Thottingal, [OPUS-MT — Building open translation services for the World](https://aclanthology.org/2020.eamt-1.61/), 2020; Jörg Tiedemann, [The Tatoeba Translation Challenge](https://aclanthology.org/2020.wmt-1.139/), 2020.

## 12 Ekim 2026 teslim doğrulaması

1.5.0-tr.16 (code 41), arm64-v8a release derlemesi başarılı. Önceki kişisel APK ile aynı uygulama kimliği ve imza doğrulandı. 23 test grubunda 304 test; son eklemeler için 16 grupta 103 test geçti (örtüşen kümeler, toplam olarak toplanmaz). Kaynak denetimi 4.647 anahtar, 6.705 kullanım ve 314 dosyada geçti. 886 anahtar için kaynakla karşılaştırılmış düzeltme kaydı var; geri kalanı bağımsız dil kontrolünden geçmiş sayılmaz.

Genel TypeScript kontrolü projedeki mevcut tip/eksik bağımlılık hataları nedeniyle geçmiyor; son değişikliklerin kontrolünde önceki hata listesine yeni hata eklenmedi. iOS widget testi yerel expo-widgets bundle bağımlılığı bulunmadığı için doğrulanamadı; Android testleri geçti. Fiziksel cihaz kontrolü bekliyor. Öğrenme paketi v1.5.0 değişmedi ve hesap işlemi yapılmadı.

## tr.16 başlangıç hatası / tr.17 düzeltmesi

Kullanıcının Galaxy A55 cihazında tr.16 açılışı durdu. ADB kaydı shouldPolyfill → locale eşleştirme zincirinde `Cannot read property prototype of undefined` hatasını doğruladı. Hermes ortamındaki eksik Intl.Locale desteği, çoğul polyfill modülü yüklenirken çöküyordu. startup-intl.ts artık canonicalization ve Locale desteğini çoğul kurallarından önce yükler. Eksik üç Intl API'sini taklit eden regresyon testi eklendi; üç test grubunda 13 test geçti. tr.16 otomatik testlerinin geçmesi fiziksel açılışın doğrulandığı anlamına gelmiyordu. tr.16 yerine tr.17 kullanılır; telefon doğrulama sonucu teslim manifestinde tutulur.

Android widget instrumentation Java derleme kontrolü de başarılı (3 dakika 40 saniye); testler cihazda çalıştırılmış sayılmaz.

tr.17 Galaxy A55 (SM-A556E) fiziksel kontrolü başarılı: tr.16 üzerine veri temizlemeden kuruldu; ana ekran açıldı; Ayarlar → Görünüm üzerinden Türkçe seçildi; yeniden açılışta Türkçe ana ekran ve devam eden ders kaydı korundu. Üç başlangıç/dil değişimi süreç kaydında TypeError, ReferenceError veya JavascriptException yok. Bu doğrulama bütün ekranlar, bildirim ve widget cihaz testlerinin tamamlandığı anlamına gelmez.
