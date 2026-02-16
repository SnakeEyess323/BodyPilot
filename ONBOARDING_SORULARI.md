# Onboarding Soruları Dokümanı

Bu dosyayı düzenleyip bana gönder. Sonra kodu ona göre güncelleyeceğim.

---

## BÖLÜM 1: Temel Fiziksel Bilgiler

| # | Soru | Cevap Tipi | Seçenekler / Detay |
|---|------|------------|-------------------|
| 1 | Yaş | Sayı | min: 10, max: 100 |
| 2 | Cinsiyet | Chip (tek seçim) | Erkek, Kadın |
| 3 | Boy (cm) | Sayı | min: 100, max: 250 |
| 4 | Kilo (kg) | Sayı | min: 30, max: 300 |
| 5 | Hedef kilo (kg) | Sayı | min: 30, max: 300 |
| 6 | Vücut yağ oranı — bilmiyorsan tahmini görünüm seç | Chip (tek seçim) | Bilmiyorum, Düşük, Orta, Yüksek |
| 7 | Günlük ortalama adım sayısı / hareketlilik | Chip (tek seçim) | 0-2000, 2000-5000, 5000-10000, 10000-20000, 20000-... |

---

## BÖLÜM 2: Hedefin nedir?

| # | Soru | Cevap Tipi | Seçenekler / Detay |
|---|------|------------|-------------------|
| 8 | Hedefin nedir? | Chip | Yağ yakmak, Kas yapmak, Sıkılaşmak, Kilo almak, Postür düzeltmek, Kondisyon artırmak, Genel sağlıklı yaşam | (burdaka birden fazla chip seçebilsin)

---

## BÖLÜM 3: Spor Geçmişi ve Seviyesi

| # | Soru | Cevap Tipi | Seçenekler / Detay |
|---|------|------------|-------------------|
| 9 | Daha önce spor yaptı mı? | Evet / Hayır | — |
| 10 | Kaç yıldır spor yapıyorsun? | Sayı | min: 0, max: 50 |
| 11 | Seviyen: Başlangıç / Orta / İleri | Chip (tek seçim) | Başlangıç, Orta, İleri |

---

## BÖLÜM 4: Sağlık ve Kısıtlar

| # | Soru | Cevap Tipi | Seçenekler / Detay |
|---|------|------------|-------------------|
| 12 | Sakatlık var mı? (diz, bel, omuz vb.) | Metin | Placeholder: "Yoksa boş bırak" |
| 13 | Kronik rahatsızlık var mı? | Metin | Placeholder: "Yoksa boş bırak" |
| 14 | Doktorun yasakladığı hareket var mı? | Metin | Placeholder: "Yoksa boş bırak" |
| 15 | Duruş bozukluğu / bel-boyun ağrısı var mı? | Metin | Placeholder: "Yoksa boş bırak" |

---

## BÖLÜM 5: Zaman ve Rutin

| # | Soru | Cevap Tipi | Seçenekler / Detay |
|---|------|------------|-------------------|
| 16 | Haftada kaç gün spor yapabilirsin? | Chip | 1 gün, 2 gün, 3 gün, 4 gün, 5 gün, 6 gün, Hergün |
| 17 | Günün hangi saatlerinde antrenman yapabilirsin? | Chip | Sabah Erkenden, Öğlen saatlerinde, Akşam üstü, Akşam |
| 18 | Ortalama antrenman süresi | Chip (tek seçim) | 30 dk, 45 dk, 60 dk, 90 dk, 120 dk |
| 19 | Ortam: Ev mi, salon mu? | Chip | Ev, Salon |

---

## BÖLÜM 6: Beslenme Bilgileri

| # | Soru | Cevap Tipi | Seçenekler / Detay |
|---|------|------------|-------------------|
| 20 | Vejetaryen / vegan mısın? | Chip (tek seçim) | Hayır, Vejetaryen, Vegan |
| 21 | Alerji var mı? | Metin | Placeholder: "Yoksa boş bırak" |
| 22 | Sevmediğin yemekler var mı? | Metin | Placeholder: "Yoksa boş bırak" |
| 23 | Günlük kaç öğün yiyorsun? | Chip (tek seçim) | 1 öğün, 2 öğün, 3 öğün, 4 öğün, 5 öğün |
| 25 | Su tüketimi ne kadar? (günlük) | Chip | Hiç su içmem, 1 litre, 1,5 litre, 2, litre, 3 litre, 4 litre |
| 26 | Alkol / sigara kullanıyor musun? | Chip | Evet, Hayır |
| 27 | Takviye kullanıyor musun? (protein tozu vb.) | Chip | Evet, Hayır | (Eğer evet derse Açıklama kutucuğu açılsın oraya yazabilsin)

---

## BÖLÜM 7: Yaşam Tarzı

| # | Soru | Cevap Tipi | Seçenekler / Detay |
|---|------|------------|-------------------|
| 28 | Ortalama uyku saati (kaç saat?) | Chip (tek seçim) | 3-4 saat, 4-6 saat, 6-8 saat, 8-10 saat, Daha fazla |
| 29 | Stres seviyesi | Chip (tek seçim) | Düşük, Orta, Yüksek |
| 30 | Masa başı mı çalışıyorsun? | Chip | Evet, Hayır |

---

## BÖLÜM 8: Psikolojik Taraf

| # | Soru | Cevap Tipi | Seçenekler / Detay |
|---|------|------------|-------------------|
| 32 | Motivasyon seviyesi | Chip (tek seçim) | Düşük, Orta, Yüksek |
| 33 | En büyük zorlanman ne? | Chip | Üşenmek, Vakitsizlik, Ağrı, Disiplin | (Birden fazla seçenek seçilebilsin)

---

## Cevap Tipleri Açıklaması

| Tip | Açıklama |
|-----|----------|
| **Sayı** | Klavyeden sayı girişi (number input) |
| **Metin** | Klavyeden metin girişi (text input) |
| **Chip (tek seçim)** | Tıklanabilir etiketler, sadece biri seçilebilir |
| **Evet / Hayır** | İki büyük buton |

---

## Düzenleme Notları

- Soru eklemek için yeni satır ekle
- Soru silmek için satırı sil
- Cevap tipini değiştirmek için "Cevap Tipi" sütununu düzenle
- Seçenekleri değiştirmek için "Seçenekler / Detay" sütununu düzenle
- Bölüm eklemek/silmek için başlıkları düzenle

Düzenledikten sonra bu dosyayı kaydet ve bana bildir!
