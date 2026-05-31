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
  { name: 'Ayran', desc: 'Soğuk ayran', price: 50, category: 'drink' },
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
]

export const CATEGORIES = [
  { key: 'pizza', label: 'Pizzalar', icon: '🍕' },
  { key: 'dessert', label: 'Tatlılar', icon: '🍫' },
  { key: 'drink', label: 'İçecekler', icon: '🥤' },
  { key: 'coffee', label: 'Kahveler', icon: '☕' },
]
