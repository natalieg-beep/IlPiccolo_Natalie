-- Patch 23: Menüpunkte + Rezepturen

-- Menu Items: Pizzen
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Margherita', 'pizza', 470.0, 0) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Marinara', 'pizza', 350.0, 10) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Fungi', 'pizza', NULL, 20) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Verdure', 'pizza', 510.0, 30) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Tonno', 'pizza', 580.0, 40) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Salame', 'pizza', 570.0, 50) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Diavolo', 'pizza', 590.0, 60) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Quattro Formaggi', 'pizza', 730.0, 70) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Sucuk', 'pizza', 550.0, 80) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Burrata', 'pizza', 795.0, 90) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Pastirma', 'pizza', 730.0, 100) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('A La Chef', 'pizza', 850.0, 110) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Bianca', 'pizza', 560.0, 120) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Nutella Pizza', 'pizza', NULL, 130) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Creamy Biscoff', 'pizza', NULL, 140) ON CONFLICT DO NOTHING;

-- Menu Items: Getränke
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Espresso Tek', 'kaffee', 110.0, 0) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Espresso Double', 'kaffee', 150.0, 10) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Lungo', 'getraenk', 120.0, 20) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Americano', 'getraenk', 140.0, 30) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Cappuccino', 'kaffee', 150.0, 40) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Caffe Latte', 'kaffee', 165.0, 50) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Latte Macchiato', 'kaffee', 175.0, 60) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Iced Americano', 'getraenk', 160.0, 70) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Iced Caffe Latte', 'kaffee', 185.0, 80) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Türk Kahvesi Tek', 'getraenk', 95.0, 90) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Türk Kahvesi Double', 'getraenk', 140.0, 100) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('*Preinfustion bei Cappu, Latte & LM von 0 auf 2 Sek', 'kaffee', NULL, 110) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('EK', 'getraenk', NULL, 120) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Lavazza Espresso', 'kaffee', NULL, 130) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Türk Kahvesi Mehemet E', 'getraenk', NULL, 140) ON CONFLICT DO NOTHING;

-- Menu Items: Extras
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Burrata', 'extra', 475.0, 0) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Fior Di Latte', 'extra', 160.0, 10) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Grana Padano / Parmesan', 'extra', 115.0, 20) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Gorgonzola', 'extra', 140.0, 30) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Gouda', 'extra', 115.0, 40) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Labne / Frischkäse', 'extra', 45.0, 50) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('🥩  FLEISCH', 'extra', NULL, 60) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Sucuk (premium)', 'extra', 80.0, 70) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Ital. Salami', 'extra', 100.0, 80) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Pastirma', 'extra', 215.0, 90) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Schinken / Jambon', 'extra', 165.0, 100) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Thunfisch in Olivenöl', 'extra', 510.0, 110) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('🥦  GEMÜSE  (Schätzpreise Hal)', 'extra', NULL, 120) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Champignons', 'extra', 30.0, 130) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Paprika (bunt)', 'extra', 25.0, 140) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Rote Zwiebeln', 'extra', 25.0, 150) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Cherry Tomaten', 'extra', 35.0, 160) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Rucola', 'extra', 25.0, 170) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Oliven (gemischt)', 'extra', 50.0, 180) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Mais', 'extra', 30.0, 190) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Basilikum', 'extra', 25.0, 200) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Chili (Acı Biber)', 'extra', 25.0, 210) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('🫙  SAUCEN & SONSTIGES', 'extra', NULL, 220) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Tomatensauce', 'extra', 75.0, 230) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Olivenöl', 'extra', 25.0, 240) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('Chili-Öl', 'extra', 25.0, 250) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('LEGENDE:  🟡 Gelb = Schätzpreis (Hal-Preise, bitte aktualisieren)  |  🔵 Blau = Eingabefeld  |  ⚫ Schwarz = Formel', 'extra', NULL, 260) ON CONFLICT DO NOTHING;
INSERT INTO menu_items (name, category, vk_price, sort) VALUES ('⚠  Burrata EK nach +10%: 187 TL/Stück → VK 200 TL war nur 7% Aufschlag. Empfehlung: 750 TL.', 'extra', NULL, 270) ON CONFLICT DO NOTHING;

-- Teig-Basis als eigene Zutat-Gruppe (1 Charge = 30 Pizzen → pro Pizza geteilt)
-- Wird als recipe_ingredient pro Pizza eingetragen mit qty/30

-- Recipe Ingredients

-- Margherita
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Mehl', 0.166667, 'kg', 0 FROM menu_items WHERE name='Margherita' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Salz', 0.0025, 'kg', 1 FROM menu_items WHERE name='Margherita' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Hefe', 0.000833, 'kg', 2 FROM menu_items WHERE name='Margherita' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Wasser', 0.116667, 'L', 3 FROM menu_items WHERE name='Margherita' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Tomatensauce', 0.1, 'kg', 4 FROM menu_items WHERE name='Margherita' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Grana Padano / Parmesan', 0.005, 'kg', 5 FROM menu_items WHERE name='Margherita' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Fior Di Latte', 0.09, 'kg', 6 FROM menu_items WHERE name='Margherita' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Basilikum', 0.003, 'kg', 7 FROM menu_items WHERE name='Margherita' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Olivenöl', 0.01, 'l', 8 FROM menu_items WHERE name='Margherita' LIMIT 1;

-- Marinara
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Mehl', 0.166667, 'kg', 0 FROM menu_items WHERE name='Marinara' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Salz', 0.0025, 'kg', 1 FROM menu_items WHERE name='Marinara' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Hefe', 0.000833, 'kg', 2 FROM menu_items WHERE name='Marinara' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Wasser', 0.116667, 'L', 3 FROM menu_items WHERE name='Marinara' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Tomatensauce', 0.1, 'kg', 4 FROM menu_items WHERE name='Marinara' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Olivenöl', 0.01, 'l', 5 FROM menu_items WHERE name='Marinara' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Knoblauch', 0.01, 'kg', 6 FROM menu_items WHERE name='Marinara' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Thymian (Kekik)', 0.005, 'kg', 7 FROM menu_items WHERE name='Marinara' LIMIT 1;

-- Fungi
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Mehl', 0.166667, 'kg', 0 FROM menu_items WHERE name='Fungi' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Salz', 0.0025, 'kg', 1 FROM menu_items WHERE name='Fungi' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Hefe', 0.000833, 'kg', 2 FROM menu_items WHERE name='Fungi' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Wasser', 0.116667, 'L', 3 FROM menu_items WHERE name='Fungi' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Tomatensauce', 0.1, 'kg', 4 FROM menu_items WHERE name='Fungi' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Grana Padano / Parmesan', 0.005, 'kg', 5 FROM menu_items WHERE name='Fungi' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Fior Di Latte', 0.09, 'kg', 6 FROM menu_items WHERE name='Fungi' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Basilikum', 0.003, 'kg', 7 FROM menu_items WHERE name='Fungi' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Olivenöl', 0.01, 'l', 8 FROM menu_items WHERE name='Fungi' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Champignons', 0.05, 'kg', 9 FROM menu_items WHERE name='Fungi' LIMIT 1;

-- Verdure
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Mehl', 0.166667, 'kg', 0 FROM menu_items WHERE name='Verdure' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Salz', 0.0025, 'kg', 1 FROM menu_items WHERE name='Verdure' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Hefe', 0.000833, 'kg', 2 FROM menu_items WHERE name='Verdure' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Wasser', 0.116667, 'L', 3 FROM menu_items WHERE name='Verdure' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Tomatensauce', 0.1, 'kg', 4 FROM menu_items WHERE name='Verdure' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Grana Padano / Parmesan', 0.005, 'kg', 5 FROM menu_items WHERE name='Verdure' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Fior Di Latte', 0.09, 'kg', 6 FROM menu_items WHERE name='Verdure' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Basilikum', 0.003, 'kg', 7 FROM menu_items WHERE name='Verdure' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Olivenöl', 0.01, 'l', 8 FROM menu_items WHERE name='Verdure' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Paprika (bunt)', 0.03, 'kg', 9 FROM menu_items WHERE name='Verdure' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Rote Zwiebeln', 0.03, 'kg', 10 FROM menu_items WHERE name='Verdure' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Mais', 0.02, 'kg', 11 FROM menu_items WHERE name='Verdure' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Oliven (gemischt)', 0.01, 'kg', 12 FROM menu_items WHERE name='Verdure' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Cherry Tomaten', 0.04, 'kg', 13 FROM menu_items WHERE name='Verdure' LIMIT 1;

-- Tonno
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Mehl', 0.166667, 'kg', 0 FROM menu_items WHERE name='Tonno' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Salz', 0.0025, 'kg', 1 FROM menu_items WHERE name='Tonno' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Hefe', 0.000833, 'kg', 2 FROM menu_items WHERE name='Tonno' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Wasser', 0.116667, 'L', 3 FROM menu_items WHERE name='Tonno' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Tomatensauce', 0.1, 'kg', 4 FROM menu_items WHERE name='Tonno' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Grana Padano / Parmesan', 0.005, 'kg', 5 FROM menu_items WHERE name='Tonno' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Fior Di Latte', 0.09, 'kg', 6 FROM menu_items WHERE name='Tonno' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Basilikum', 0.003, 'kg', 7 FROM menu_items WHERE name='Tonno' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Olivenöl', 0.01, 'l', 8 FROM menu_items WHERE name='Tonno' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Thunfisch in Olivenöl', 0.05, 'kg', 9 FROM menu_items WHERE name='Tonno' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Rote Zwiebeln', 0.03, 'kg', 10 FROM menu_items WHERE name='Tonno' LIMIT 1;

-- Salame
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Mehl', 0.166667, 'kg', 0 FROM menu_items WHERE name='Salame' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Salz', 0.0025, 'kg', 1 FROM menu_items WHERE name='Salame' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Hefe', 0.000833, 'kg', 2 FROM menu_items WHERE name='Salame' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Wasser', 0.116667, 'L', 3 FROM menu_items WHERE name='Salame' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Tomatensauce', 0.1, 'kg', 4 FROM menu_items WHERE name='Salame' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Grana Padano / Parmesan', 0.005, 'kg', 5 FROM menu_items WHERE name='Salame' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Fior Di Latte', 0.09, 'kg', 6 FROM menu_items WHERE name='Salame' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Basilikum', 0.003, 'kg', 7 FROM menu_items WHERE name='Salame' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Olivenöl', 0.01, 'l', 8 FROM menu_items WHERE name='Salame' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Ital. Salami', 0.038, 'kg', 9 FROM menu_items WHERE name='Salame' LIMIT 1;

-- Diavolo
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Mehl', 0.166667, 'kg', 0 FROM menu_items WHERE name='Diavolo' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Salz', 0.0025, 'kg', 1 FROM menu_items WHERE name='Diavolo' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Hefe', 0.000833, 'kg', 2 FROM menu_items WHERE name='Diavolo' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Wasser', 0.116667, 'L', 3 FROM menu_items WHERE name='Diavolo' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Tomatensauce', 0.1, 'kg', 4 FROM menu_items WHERE name='Diavolo' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Grana Padano / Parmesan', 0.005, 'kg', 5 FROM menu_items WHERE name='Diavolo' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Fior Di Latte', 0.09, 'kg', 6 FROM menu_items WHERE name='Diavolo' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Basilikum', 0.003, 'kg', 7 FROM menu_items WHERE name='Diavolo' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Olivenöl', 0.01, 'l', 8 FROM menu_items WHERE name='Diavolo' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Ital. Salami', 0.038, 'kg', 9 FROM menu_items WHERE name='Diavolo' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Chili', 0.015, 'kg', 10 FROM menu_items WHERE name='Diavolo' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Chili-Öl', 0.01, 'l', 11 FROM menu_items WHERE name='Diavolo' LIMIT 1;

-- Quattro Formaggi
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Mehl', 0.166667, 'kg', 0 FROM menu_items WHERE name='Quattro Formaggi' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Salz', 0.0025, 'kg', 1 FROM menu_items WHERE name='Quattro Formaggi' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Hefe', 0.000833, 'kg', 2 FROM menu_items WHERE name='Quattro Formaggi' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Wasser', 0.116667, 'L', 3 FROM menu_items WHERE name='Quattro Formaggi' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Tomatensauce', 0.1, 'kg', 4 FROM menu_items WHERE name='Quattro Formaggi' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Grana Padano / Parmesan', 0.005, 'kg', 5 FROM menu_items WHERE name='Quattro Formaggi' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Fior Di Latte', 0.09, 'kg', 6 FROM menu_items WHERE name='Quattro Formaggi' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Basilikum', 0.003, 'kg', 7 FROM menu_items WHERE name='Quattro Formaggi' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Olivenöl', 0.01, 'l', 8 FROM menu_items WHERE name='Quattro Formaggi' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Gorgonzola', 0.025, 'kg', 9 FROM menu_items WHERE name='Quattro Formaggi' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Gouda', 0.025, 'kg', 10 FROM menu_items WHERE name='Quattro Formaggi' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Grana Padano / Parmesan (extra)', 0.0035, 'kg', 11 FROM menu_items WHERE name='Quattro Formaggi' LIMIT 1;

-- Sucuk
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Mehl', 0.166667, 'kg', 0 FROM menu_items WHERE name='Sucuk' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Salz', 0.0025, 'kg', 1 FROM menu_items WHERE name='Sucuk' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Hefe', 0.000833, 'kg', 2 FROM menu_items WHERE name='Sucuk' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Wasser', 0.116667, 'L', 3 FROM menu_items WHERE name='Sucuk' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Tomatensauce', 0.1, 'kg', 4 FROM menu_items WHERE name='Sucuk' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Grana Padano / Parmesan', 0.005, 'kg', 5 FROM menu_items WHERE name='Sucuk' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Fior Di Latte', 0.09, 'kg', 6 FROM menu_items WHERE name='Sucuk' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Basilikum', 0.003, 'kg', 7 FROM menu_items WHERE name='Sucuk' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Olivenöl', 0.01, 'l', 8 FROM menu_items WHERE name='Sucuk' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Sucuk', 0.038, 'kg', 9 FROM menu_items WHERE name='Sucuk' LIMIT 1;

-- Burrata
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Mehl', 0.166667, 'kg', 0 FROM menu_items WHERE name='Burrata' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Salz', 0.0025, 'kg', 1 FROM menu_items WHERE name='Burrata' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Hefe', 0.000833, 'kg', 2 FROM menu_items WHERE name='Burrata' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Wasser', 0.116667, 'L', 3 FROM menu_items WHERE name='Burrata' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Tomatensauce', 0.1, 'kg', 4 FROM menu_items WHERE name='Burrata' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Burrata', 0.1, 'kg', 5 FROM menu_items WHERE name='Burrata' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Grana Padano / Parmesan', 0.015, 'kg', 6 FROM menu_items WHERE name='Burrata' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Basilikum', 0.003, 'kg', 7 FROM menu_items WHERE name='Burrata' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Rucola', 0.015, 'kg', 8 FROM menu_items WHERE name='Burrata' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Cherry Tomaten', 0.03, 'kg', 9 FROM menu_items WHERE name='Burrata' LIMIT 1;

-- Pastirma
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Mehl', 0.166667, 'kg', 0 FROM menu_items WHERE name='Pastirma' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Salz', 0.0025, 'kg', 1 FROM menu_items WHERE name='Pastirma' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Hefe', 0.000833, 'kg', 2 FROM menu_items WHERE name='Pastirma' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Wasser', 0.116667, 'L', 3 FROM menu_items WHERE name='Pastirma' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Tomatensauce', 0.1, 'kg', 4 FROM menu_items WHERE name='Pastirma' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Grana Padano / Parmesan', 0.005, 'kg', 5 FROM menu_items WHERE name='Pastirma' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Fior Di Latte', 0.09, 'kg', 6 FROM menu_items WHERE name='Pastirma' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Basilikum', 0.003, 'kg', 7 FROM menu_items WHERE name='Pastirma' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Olivenöl', 0.01, 'l', 8 FROM menu_items WHERE name='Pastirma' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Pastirma', 0.038, 'kg', 9 FROM menu_items WHERE name='Pastirma' LIMIT 1;

-- A La Chef
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Mehl', 0.166667, 'kg', 0 FROM menu_items WHERE name='A La Chef' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Salz', 0.0025, 'kg', 1 FROM menu_items WHERE name='A La Chef' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Hefe', 0.000833, 'kg', 2 FROM menu_items WHERE name='A La Chef' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Wasser', 0.116667, 'L', 3 FROM menu_items WHERE name='A La Chef' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Tomatensauce', 0.1, 'kg', 4 FROM menu_items WHERE name='A La Chef' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Grana Padano / Parmesan', 0.015, 'kg', 5 FROM menu_items WHERE name='A La Chef' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Basilikum', 0.003, 'kg', 6 FROM menu_items WHERE name='A La Chef' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Burrata', 0.1, 'kg', 7 FROM menu_items WHERE name='A La Chef' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Rucola', 0.015, 'kg', 8 FROM menu_items WHERE name='A La Chef' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Pastirma', 0.03, 'kg', 9 FROM menu_items WHERE name='A La Chef' LIMIT 1;

-- Bianca
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Mehl', 0.166667, 'kg', 0 FROM menu_items WHERE name='Bianca' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Salz', 0.0025, 'kg', 1 FROM menu_items WHERE name='Bianca' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Hefe', 0.000833, 'kg', 2 FROM menu_items WHERE name='Bianca' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Wasser', 0.116667, 'L', 3 FROM menu_items WHERE name='Bianca' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Labne / Frischkäse', 0.05, 'kg', 4 FROM menu_items WHERE name='Bianca' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Milch', 0.02, 'l', 5 FROM menu_items WHERE name='Bianca' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Basilikum', 0.003, 'kg', 6 FROM menu_items WHERE name='Bianca' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Schinken / Jambon', 0.032, 'kg', 7 FROM menu_items WHERE name='Bianca' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Rucola', 0.015, 'kg', 8 FROM menu_items WHERE name='Bianca' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Cherry Tomaten', 0.03, 'kg', 9 FROM menu_items WHERE name='Bianca' LIMIT 1;

-- Nutella Pizza
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Mehl', 0.166667, 'kg', 0 FROM menu_items WHERE name='Nutella Pizza' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Salz', 0.0025, 'kg', 1 FROM menu_items WHERE name='Nutella Pizza' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Hefe', 0.000833, 'kg', 2 FROM menu_items WHERE name='Nutella Pizza' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Wasser', 0.116667, 'L', 3 FROM menu_items WHERE name='Nutella Pizza' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Nutella', 0.1, 'kg', 4 FROM menu_items WHERE name='Nutella Pizza' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Früchte (saisonal)', 0.07, 'kg', 5 FROM menu_items WHERE name='Nutella Pizza' LIMIT 1;

-- Creamy Biscoff
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Mehl', 0.166667, 'kg', 0 FROM menu_items WHERE name='Creamy Biscoff' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Salz', 0.0025, 'kg', 1 FROM menu_items WHERE name='Creamy Biscoff' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Hefe', 0.000833, 'kg', 2 FROM menu_items WHERE name='Creamy Biscoff' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Wasser', 0.116667, 'L', 3 FROM menu_items WHERE name='Creamy Biscoff' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Biscoff Cream', 0.1, 'kg', 4 FROM menu_items WHERE name='Creamy Biscoff' LIMIT 1;
INSERT INTO recipe_ingredients (menu_item_id, name, quantity, unit, sort) SELECT id, 'Biscoff Kekse', 0.015, 'kg', 5 FROM menu_items WHERE name='Creamy Biscoff' LIMIT 1;
