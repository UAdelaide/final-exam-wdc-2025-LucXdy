USE DogWalkService;

INSERT INTO Users ( username, email, password_hash, role ) VALUES
 
('alice123', 'alice@example.com', 'hashed123', 'owner'),
('bobwalker', 'bob@example.com', 'hashed456', 'walker'),
('carol123', 'carol@example.com', 'hashed789', 'owner'),
('davewalker', 'dave@example.com', 'hashedabc', 'walker'),
('eveowner', 'eve@example.com', 'hashedxyz', 'owner');

INSERT INTO Dogs (owner_id, name, size) VALUES

((SELECT user_id FROM Users WHERE username = 'alice123'), 'Max', 'medium'),
((SELECT user_id FROM Users WHERE username = 'carol123'), 'Bella', 'small'),
((SELECT user_id FROM Users WHERE username = 'eveowner'), 'Rocky', 'large'),
((SELECT user_id FROM Users WHERE username = 'alice123'), 'Daisy', 'small'),
((SELECT user_id FROM Users WHERE username = 'carol123'), 'Charlie', 'medium');

INSERT INTO WalkRequests ( dog_id,requested_time, duration_minutes,location,status) VALUES

((SELECT dog_id FROM Dogs WHERE name = 'Max' AND owner_id = (SELECT user_id FROM Users WHERE username = 'alice123')), 
 '2025-06-10 08:00:00', 30, 'Parklands', 'open'),

((SELECT dog_id FROM Dogs WHERE name = 'Bella' AND owner_id = (SELECT user_id FROM Users WHERE username = 'carol123')), 
 '2025-06-10 09:30:00', 45, 'Beachside Ave', 'accepted'),

((SELECT dog_id FROM Dogs WHERE name = 'Rocky'), 
 '2025-06-11 14:00:00', 60, 'River Trail', 'open'),

((SELECT dog_id FROM Dogs WHERE name = 'Daisy'), 
 '2025-06-12 07:15:00', 30, 'Main Street', 'completed'),

((SELECT dog_id FROM Dogs WHERE name = 'Charlie'), 
 '2025-06-12 16:00:00', 20, 'Greenwood Park', 'cancelled');