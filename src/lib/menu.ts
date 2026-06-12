export type MenuItem = { name: string; desc: string; price: number; category: string }

export const MENU: MenuItem[] = [
  // Pizzalar
  { name: 'Marinara', desc: 'San Marzano domates, sarımsak, top kekik & zeytinyağı', price: 350, category: 'pizza' },
  { name: 'Margherita', desc: 'San Marzano domates, parmesan, taze fesleğen, Fior di Latte & zeytinyağı', price: 470, category: 'pizza' },
  { name: 'Funghi', desc: 'San Marzano domates, parmesan, fesleğen, Fior di Latte, zeytinyağı & taze mantar', price: 490, category: 'pizza' },
  { name: 'Verdure', desc: 'San Marzano domates, parmesan, fesleğen, Fior di Latte, kırmızı biber, soğan, mısır, zeytin & çeri domates', price: 510, category: 'pizza' },
  { name: 'Sucuk', desc: 'San Marzano domates, parmesan, fesleğen, Fior di Latte, zeytinyağı & dana sucuk', price: 550, category: 'pizza' },
  { name: 'Salame', desc: 'San Marzano domates, parmesan, fesleğen, Fior di Latte, zeytinyağı & İtalyan dana salamı', price: 570, category: 'pizza' },
  { name: 'Diavolo', desc: 'San Marzano domates, parmesan, fesleğen, Fior di Latte, acı İtalyan salamı, pepperoni & acı biber yağı', price: 590, category: 'pizza' },
  { name: 'Bianca', desc: 'Labne sosu, fesleğen, zeytinyağı, dana jambon, taze roka & çeri domates', price: 560, category: 'pizza' },
  { name: 'Tonno', desc: 'San Marzano domates, parmesan, fesleğen, Fior di Latte, zeytinyağı, ton balığı & kırmızı soğan', price: 580, category: 'pizza' },
  { name: 'Pastırma', desc: 'San Marzano domates, parmesan, fesleğen, Fior di Latte, zeytinyağı & pastırma', price: 730, category: 'pizza' },
  { name: 'Quattro Formaggi', desc: 'San Marzano domates, parmesan, Fior di Latte, gorgonzola, gouda, fesleğen & zeytinyağı', price: 730, category: 'pizza' },
  { name: 'Burrata', desc: 'San Marzano domates, parmesan, fesleğen, zeytinyağı, taze burrata, taze roka & çeri domates', price: 795, category: 'pizza' },
  { name: 'A La Chef', desc: 'San Marzano domates, parmesan, fesleğen, zeytinyağı, taze roka, taze burrata & pastırma', price: 850, category: 'pizza' },
  // Dolce Pizza
  { name: 'Dolce Nutella', desc: 'Nutella ve taze mevsim meyveleri ile süslenmiş tatlı Napoli pizzası', price: 340, category: 'dessert' },
  { name: 'Dolce Creamy Biscoff', desc: 'Bischoff Cream ve Lotus Bischoff Crunch ile süslenmiş tatlı Napoli pizzası', price: 340, category: 'dessert' },
  // Tatlılar
  { name: 'Tiramisu', desc: 'Ev yapımı: kedi dili bisküvi, espresso, maskarpone kremi & kakao', price: 300, category: 'dessert' },
  { name: 'Piccolo Crunch', desc: 'Kahveli süzme yoğurt kreması, Lotus Biscoff & kakao', price: 190, category: 'dessert' },
  { name: 'Üç Gen', desc: 'Fındıklı üçgen pasta', price: 190, category: 'dessert' },
  // İçecekler
  { name: 'Damla Su 330ml', desc: 'Cam şişe', price: 60, category: 'drink' },
  { name: 'Damla Su 750ml', desc: 'Cam şişe', price: 135, category: 'drink' },
  { name: 'Damla Mineral Suyu 330ml', desc: 'Cam şişe', price: 75, category: 'drink' },
  { name: 'Damla Mineral Suyu 750ml', desc: 'Cam şişe', price: 165, category: 'drink' },
  { name: 'Damla Soda 200ml', desc: 'Cam şişe', price: 45, category: 'drink' },
  { name: 'Coca-Cola 300ml', desc: 'Cam şişe', price: 110, category: 'drink' },
  { name: 'Coca-Cola Zero 300ml', desc: 'Cam şişe', price: 110, category: 'drink' },
  { name: 'Fanta 300ml', desc: 'Cam şişe', price: 110, category: 'drink' },
  { name: 'Sprite 300ml', desc: 'Cam şişe', price: 110, category: 'drink' },
  { name: 'Fuse Tea Şeftali 250ml', desc: 'Cam şişe', price: 120, category: 'drink' },
  { name: 'Fuse Tea Limon 250ml', desc: 'Cam şişe', price: 120, category: 'drink' },
  { name: 'Ayran', desc: 'Soğuk ayran', price: 60, category: 'drink' },
  // Kahveler
  { name: 'Espresso Tek', desc: '', price: 110, category: 'coffee' },
  { name: 'Espresso Double', desc: '', price: 150, category: 'coffee' },
  { name: 'Lungo', desc: '', price: 120, category: 'coffee' },
  { name: 'Americano', desc: '', price: 140, category: 'coffee' },
  { name: 'Cappuccino', desc: '', price: 150, category: 'coffee' },
  { name: 'Caffe Latte', desc: '', price: 165, category: 'coffee' },
  { name: 'Latte Macchiato', desc: '', price: 175, category: 'coffee' },
  { name: 'Iced Americano', desc: '', price: 160, category: 'coffee' },
  { name: 'Iced Caffe Latte', desc: '', price: 185, category: 'coffee' },
  { name: 'Türk Kahvesi Tek', desc: '', price: 95, category: 'coffee' },
  { name: 'Türk Kahvesi Double', desc: '', price: 140, category: 'coffee' },
  // Extras — Käse
  { name: 'Burrata EKSTRA', desc: 'Taze burrata (100g)', price: 475, category: 'extra' },
  { name: 'Fior di Latte EKSTRA', desc: 'Fior di Latte (50g)', price: 160, category: 'extra' },
  { name: 'Grana Padano / Parmesan EKSTRA', desc: 'Rendelenmiş Grana Padano / Parmesan (20g)', price: 115, category: 'extra' },
  { name: 'Gorgonzola EKSTRA', desc: 'Gorgonzola (30g)', price: 140, category: 'extra' },
  { name: 'Gouda EKSTRA', desc: 'Gouda (30g)', price: 115, category: 'extra' },
  { name: 'Labne / Taze Peynir EKSTRA', desc: 'Labne / taze peynir (50g)', price: 45, category: 'extra' },
  // Extras — Fleisch
  { name: 'Sucuk EKSTRA', desc: 'Premium dana sucuk (38g)', price: 80, category: 'extra' },
  { name: 'İtalyan Salamı EKSTRA', desc: 'İtalyan dana salamı (38g)', price: 100, category: 'extra' },
  { name: 'Pastırma EKSTRA', desc: 'Pastırma (20g)', price: 215, category: 'extra' },
  { name: 'Dana Jambon EKSTRA', desc: 'Dana jambon (32g)', price: 165, category: 'extra' },
  { name: 'Tonno EKSTRA', desc: 'Ton balığı (50g)', price: 200, category: 'extra' },
  // Extras — Gemüse
  { name: 'Mantar EKSTRA', desc: 'Taze kültür mantarı (50g)', price: 30, category: 'extra' },
  { name: 'Kapya Biber EKSTRA', desc: 'Karışık kapya biber (50g)', price: 25, category: 'extra' },
  { name: 'Kırmızı Soğan EKSTRA', desc: 'Kırmızı soğan (50g)', price: 25, category: 'extra' },
  { name: 'Çeri Domates EKSTRA', desc: 'Çeri domates (50g)', price: 35, category: 'extra' },
  { name: 'Roka EKSTRA', desc: 'Taze roka (20g)', price: 25, category: 'extra' },
  { name: 'Zeytin EKSTRA', desc: 'Karışık dilimlenmiş zeytin (30g)', price: 50, category: 'extra' },
  { name: 'Mısır EKSTRA', desc: 'Mısır (40g)', price: 30, category: 'extra' },
  { name: 'Taze Fesleğen EKSTRA', desc: 'Taze fesleğen (3g)', price: 25, category: 'extra' },
  { name: 'Acı Biber EKSTRA', desc: 'Acı biber (15g)', price: 25, category: 'extra' },
  // Extras — Saucen
  { name: 'San Marzano Domates Sosu EKSTRA', desc: 'San Marzano domates sosu (100g)', price: 75, category: 'extra' },
  { name: 'Zeytinyağı EKSTRA', desc: 'Sızma zeytinyağı (15ml)', price: 25, category: 'extra' },
  { name: 'Acı Biber Yağı EKSTRA', desc: 'Acı biber yağı (15ml)', price: 25, category: 'extra' },
]

export const CATEGORIES = [
  { key: 'pizza',     label: 'Pizzalar',   icon: '🍕' },
  { key: 'extra',     label: 'Ekstralar',  icon: '➕' },
  { key: 'dessert',   label: 'Tatlılar',   icon: '🍫' },
  { key: 'drink',     label: 'İçecekler',  icon: '🥤' },
  { key: 'coffee',    label: 'Kahveler',   icon: '☕' },
  { key: 'sonstiges', label: 'Sonstiges',  icon: '✏️' },
]

// Sub-group labels for extras display
export const EXTRA_GROUPS: { label: string; names: string[] }[] = [
  { label: '🧀 Peynir', names: ['Burrata EKSTRA', 'Fior di Latte EKSTRA', 'Grana Padano / Parmesan EKSTRA', 'Gorgonzola EKSTRA', 'Gouda EKSTRA', 'Labne / Taze Peynir EKSTRA'] },
  { label: '🥩 Et', names: ['Sucuk EKSTRA', 'İtalyan Salamı EKSTRA', 'Pastırma EKSTRA', 'Dana Jambon EKSTRA', 'Tonno EKSTRA'] },
  { label: '🥦 Sebze', names: ['Mantar EKSTRA', 'Kapya Biber EKSTRA', 'Kırmızı Soğan EKSTRA', 'Çeri Domates EKSTRA', 'Roka EKSTRA', 'Zeytin EKSTRA', 'Mısır EKSTRA', 'Taze Fesleğen EKSTRA', 'Acı Biber EKSTRA'] },
  { label: '🫙 Sos', names: ['San Marzano Domates Sosu EKSTRA', 'Zeytinyağı EKSTRA', 'Acı Biber Yağı EKSTRA'] },
]
