-- Example seed data
insert into ingredients (name, unit, stock, min_stock_level, cost_per_unit)
values
('Burger Bun','pcs',100,20,500),
('Beef Patty','pcs',80,20,1500),
('Cheese Slice','pcs',200,50,200),
('Lettuce','g',5000,1000,10),
('Coffee Beans','g',2000,500,50),
('Milk','ml',10000,2000,2)
ON CONFLICT DO NOTHING;

insert into menu_items (name, category, price, cost, image, description)
values
('Classic Cheeseburger','Food',9000,3500,'https://picsum.photos/200/200?random=1','Juicy beef patty with cheddar cheese.'),
('Double Bacon Burger','Food',13000,5500,'https://picsum.photos/200/200?random=2','Double patty, crispy bacon.'),
('Latte','Drinks',4500,1200,'https://picsum.photos/200/200?random=3','Steamed milk with espresso.'),
('Cappuccino','Drinks',4500,1200,'https://picsum.photos/200/200?random=4','Espresso with frothy milk.'),
('Caesar Salad','Food',9500,2500,'https://picsum.photos/200/200?random=5','Fresh romaine with croutons.')
ON CONFLICT DO NOTHING;

