drop table liked cascade;
drop table archive cascade;
drop table cart cascade;                                                                                                    --udalenie tablic
drop table products cascade;
drop table users cascade;

-----------------------------------------------------------------------------------------------

create table users ( 
user_id serial primary key, 
username text not null,
full_name varchar(100),
phone varchar(50),
password_hash varchar(255) not null, 
email varchar(255) not null unique, 
role text not null check (role in ('admin', 'user', 'seller')),
created_at timestamp default current_timestamp,
avatar varchar(255),
salt bytea not null
);

create table products (
product_id serial primary key,
product_name varchar(255) not null,
description text,
product_category text,
image text,
posted_at timestamp default current_timestamp,                                                                                   --tablicy
price float not null,
amount int not null check (amount >= 0)
);

create table cart (
user_id int,
product_id int,
quantity int not null default 1 check (quantity > 0),
added_at timestamp default current_timestamp,
primary key (user_id, product_id),
foreign key (user_id) references users(user_id) on delete cascade,
foreign key (product_id) references products(product_id) on delete cascade
);

create table archive (
order_id varchar(255),
archive_id serial primary key,
user_id int,
product_id int,
quantity int not null default 1,
purchase_date timestamp default current_timestamp,
foreign key (user_id) references users(user_id) on delete set null,
foreign key (product_id) references products(product_id) on delete set null
);

create table liked (
user_id int,
product_id int,
purchase_date timestamp default current_timestamp,
primary key (user_id, product_id),
foreign key (user_id) references users(user_id) on delete cascade,
foreign key (product_id) references products(product_id) on delete cascade
);

-----------------------------------------------------------------------------------------------

insert into users(username,password_hash,email,role,created_at,avatar,salt)
values
('niko','hohoho','niko@gmail.com','user','09.04.25','niko.jpg','1234'),
('amr','amr123','amik@gmail.com','admin','01.04.25','amirro.jpg','12345'),
('mans','raiden321','mukyn@gmail.com','seller','05.04.25','mukinov.jpg','322');                               --vvod informacii (oni po suti nujny dl9 primera)

insert into products(product_name, description, product_category, image, price, amount)
values
('knife','very sharp','self defend','knife.jpg',999.90,10),
('ring','very pretty','accessory','ring.png',23999.90,5);

-----------------------------------------------------------------------------------------------

update users
set role = 'user' --vyberite role, tipo user,admin,seller                                                                 --obnovlenie rolei
where email = 'niko@gmail.com'; --vvedite email (email potomu 4to on doljen byt' unikal'nym i tak leg4e)

-----------------------------------------------------------------------------------------------

select * from users
order by user_id;
																														--vyvod informacii
select * from products
order by price;

-----------------------------------------------------------------------------------------------

create table ai(
id serial primary key,
response text,
answer text
);




insert into cart(user_id, product_id, quantity)
values
(1,1,10);





select * from users
select * from products

create table product_colors (
    color_id serial primary key,
    product_id integer references products(product_id) on delete cascade,
    color_name varchar(50) not null,
    image_path varchar(255) not null
);


------------------------------------------ С ЦВЕТАМИ ДВА ТОВАРА -------------------------------------------------------------------------------------
insert into product_colors (product_id, color_name, image_path) values
(2, 'green', 'https://cdn.shopify.com/s/files/1/0574/8041/3232/files/2024-10-31_3871e6f3-f80c-4103-8ceb-4caf4c2d37ea_640x.jpg?v=1730389329'),
(2, 'beige', 'https://cdn.shopify.com/s/files/1/0574/8041/3232/files/jzh4mwxalcupmuwlmeuc_640x.jpg?v=1730473262'),
(1, 'pink', 'https://cdn.shopify.com/s/files/1/0574/8041/3232/files/udskmohbdbuy0j8y7ljn_640x.jpg?v=1741967582'),
(1, 'blue', 'https://cdn.shopify.com/s/files/1/0574/8041/3232/files/joxbitfov0ckwhheeumy_640x.jpg?v=1744840001'),
(1, 'black', 'https://cdn.shopify.com/s/files/1/0574/8041/3232/files/kwja2hovouem1a8sauxu_640x.jpg?v=1741967582');

insert into products(product_name, description, product_category, image, price, amount)
values
('Benchmade bugout','The Bugout® was designed for the modern outdoor adventurer, incorporating the lightest, best performing materials in an extremely slim yet ergonomic package.','knifes','https://cdn.shopify.com/s/files/1/0574/8041/3232/files/joxbitfov0ckwhheeumy_640x.jpg?v=1744840001',92999.99,10)

insert into products(product_name, description, product_category, image, price, amount)
values
('Benchmade griptilian','Workhorse tough meets custom carry. The Griptilian family is highly-respected, serving as both a gateway to premium knives and often the last knife you may ever need. ','knifes','https://cdn.shopify.com/s/files/1/0574/8041/3232/files/2024-10-31_3871e6f3-f80c-4103-8ceb-4caf4c2d37ea_640x.jpg?v=1730389329',80999.99,10)


TRUNCATE TABLE products RESTART IDENTITY CASCADE;

------------------------------------ ЭТО ВО ПОСЛЕ ТЕХ ДВУХ ТОВАРОВ --------------------------------------------------
insert into products(product_name, description, product_category, image, price, amount)
values
('elegant knife','very sharp','knifes','https://cdn.store-factory.com/www.couteaux-services.com/content/product_11772050b.jpg?v=1695805939',999.90,10),
('beautiful charm','very beautiful ','charms','https://ellijewelry.com/cdn/shop/files/83798-image-squared-1-1642557227.jpg?v=1740726921',15999.90,20),
('pretty bracelet','for your hand','bracelets','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQN0Gs7Y72IzpjnnDamcwLvtbGToBDbzWUNNA&s',15999.90,20),
('m9 knife','for people you dont like','knifes','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSZuQZQIXtykVh3dcj-n6wp2cKb6bXDkc3aGw&s',1299.90,15),
('elegant watch','best accessory for the hand','watchs','https://galeriemagazine.com/wp-content/uploads/2023/06/vac-traditionnelle-tourb-6000t-000p-h025-sdt_WEB.jpg',25999.90,40),
('casio','you can make bomb with this','watchs','https://albion-time.kz/upload/iblock/fd8/nkwp8f53rwg60ik5d4i8nizs52nkvqrd/chasy_naruchnye_casio_a_178wa_1adf.jpg',15999.90,20),
('necklace','for your neck','necklaces','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTme93DsoJ5_Y2VAnX05HCXSn8an-H5dATuGQ&s',18999.90,10),
('brilliant ring','a lot of brilliants','rings','https://www.productphoto.com/wp-content/uploads/2022/10/Ring_6_1-scaled.jpg.webp',39999.90,2),
('ring with big diamond','big diamond make everuthing prettier','rings','https://fixthephoto.com/blog/UserFiles/jewelry-photography.jpg',49999.90,1),
('earring','best for the ear','charms','https://www.productphoto.com/wp-content/uploads/2022/10/Earring_2.jpg.webp',12999.90,20),
('fully brilliant ring','best of the best','rings','https://www.productphoto.com/wp-content/uploads/2022/10/Ring10_1-scaled.jpg.webp',69999.90,1),
('earring with big pearl','if you like ocean','charms','https://img.freepik.com/free-psd/elegant-pearl-diamond-earrings-exquisite-gold-jewelry_632498-25896.jpg?semt=ais_hybrid&w=740',10999.90,15),
('ring with square brilliant','unique form of brillint','rings','https://www.slazzer.com/blog/wp-content/uploads/2023/10/silver.jpg',17999.90,10),
('silver necklace','beauty is in simplicity','necklaces','https://thumbs.dreamstime.com/b/silver-necklace-chain-luxury-jewelry-white-background-silver-necklace-chain-luxury-jewelry-isolated-white-background-132645890.jpg',5999.90,30),
('yamato','if you want it, you have to take it','knifes','https://static.wikia.nocookie.net/devilmaycry/images/e/e9/Yamato_DMC4.png/revision/latest?cb=20150508044746',44444.44,1),
('nail bracelet','unique design','bracelets','https://5.imimg.com/data5/SELLER/Default/2024/3/404320260/YX/OI/RZ/44974770/pose5593-ok-500x500.jpg',3999.90,50),
('damaged ring','illusion of damege','rings','https://st3.depositphotos.com/1516544/19356/i/450/depositphotos_193562546-stock-photo-jewellery-ring-white-background-high.jpg',16999.90,4),
('black ring','just black ring','rings','https://cdn.prod.website-files.com/66f937b4438ff4d8d9069565/67208657f65c312fe60f6e5b_White_background_for_jewelry_photography_c683b14f43.jpeg',599.90,100),
('white gold ring','not a default gold','rings','https://www.vancleefarpels.com/content/dam/rcq/vca/6r/XO/2q/w5/RL/uf/xD/1I/HJ/kk/ig/6rXO2qw5RLufxD1IHJkkig.png',27999.90,5),
('wedding ring','only for special people','rings','https://cdn.sanity.io/images/kkdykxo2/production/b99d6ace5fce9e2a0b0c72b85c9a9883bad1a127-1920x1920.jpg/side-star-ring-white-gold-and-diamond-efva-attling_13-102-02293_.jpg',36999.90,2),
('silver watch','can make your style better','watchs','https://img.pikbest.com/wp/202350/wrist-watch-3d-render-of-a-high-end-classic-analog-silver-men-s-on-white-background_9788489.jpg!w700wp',19999.90,10),
('watche with rim numbers','elegant oldstyle','watchs','https://static.vecteezy.com/system/resources/thumbnails/008/083/584/small_2x/men-s-wrist-watch-on-white-background-studio-shoot-photo.jpg',24999.90,5),
('survival knife','survive with the style','knifes','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSyNXreVS374mOdS9mzVVV4SI7Ol5fffeZI1VHPyOhwigNr47J97FoWNnAetZ51Lj2Hmi4&usqp=CAU',17999.90,15),
('benchmade','for the one who know','knifes','https://assets.katogroup.eu/i/katogroup/BE535BK-2_01_benchmade?%24product-image%24=&fmt=auto&h=434&w=652',19999.90,10),
('necklace from pearls','pearl maded','necklaces','https://laforgedor.com/cdn/shop/files/Photo2024-10-22_145923.jpg?v=1729623579',22999.90,10),
('ring','very pretty','accessory','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTEovu8W62c4q-tydLy2oxgqjOZGsyc5frd4w&s',23999.90,5);




select * from liked
drop table liked
create table liked (
user_id int,
product_id int,
purchase_date timestamp default current_timestamp,
primary key (user_id, product_id),
foreign key (user_id) references users(user_id) on delete cascade,
foreign key (product_id) references products(product_id) on delete cascade
);
insert into liked values (1,1) 



truncate table archive restart identity cascade;
insert into archive (order_id, user_id, product_id, quantity)
values 
('QwaGt56t', 1, 2, 1),
('QwaGt56t', 1, 1, 1),
('ORD-002', 1, 1, 3),
('ORD-003', 1, 2, 1);


CREATE TABLE addresses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id),
  label VARCHAR(100) NOT NULL,
  details TEXT NOT NULL,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

