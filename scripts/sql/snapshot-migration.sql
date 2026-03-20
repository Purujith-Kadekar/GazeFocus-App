-- Generated from Prisma Studio HTML snapshots
BEGIN;

-- User: 3 row(s)
INSERT INTO public."User" ("id", "createdAt", "currentStreak", "deletionScheduledAt", "email", "emailVerified", "image", "isBlocked", "lastActiveDate", "updatedAt") VALUES ('cmm0s6pyg0000i9evqafvt8x4', '2026-02-24T15:49:24.328Z', '9', NULL, 'puru0kadek@gmail.com', NULL, 'https://lh3.googleusercontent.com/a/ACg8ocLzTHt09i8AUNipfc_WN--TIi-nGG6wQDYdpN2HkFegNSEpTYMp=s96-c', false, '2026-03-17T18:30:00.000Z', CURRENT_TIMESTAMP);
INSERT INTO public."User" ("id", "createdAt", "currentStreak", "deletionScheduledAt", "email", "emailVerified", "image", "isBlocked", "lastActiveDate", "updatedAt") VALUES ('cmmjbv3x90000w0v0xul8jess', '2026-03-09T15:20:06.045Z', '2', NULL, 'keerthana@gmail.com', NULL, NULL, false, '2026-03-12T18:30:00.000Z', CURRENT_TIMESTAMP);
INSERT INTO public."User" ("id", "createdAt", "currentStreak", "deletionScheduledAt", "email", "emailVerified", "image", "isBlocked", "lastActiveDate", "updatedAt") VALUES ('cmmnplzzp0000wujl0o5100qy', '2026-03-12T16:56:00.373Z', '1', NULL, 'prajwalbabanna@gmail.com', NULL, 'https://lh3.googleusercontent.com/a/ACg8ocJ1g3nmo6yZuziww0I356112o4EBPETld1w-tLFCB3CM2MFW7s=s96-c', false, '2026-03-12T00:00:00.000Z', CURRENT_TIMESTAMP);

-- Account: 2 row(s)
INSERT INTO public."Account" ("id", "access_token", "expires_at", "id_token", "provider", "providerAccountId", "refresh_token", "scope", "session_state", "token_type", "type", "userId") VALUES ('cmm0s6pz00002i9evzjcmt76y', 'ya29.a0ATkoCc4UVo5QKZy4O578YDRA9Y81zfGvyV823sXpq2WlnRIXkPo1Z1FVV5jzcOGcLm-hJT8eH0erGWgK6VYNLDZn1dVTm-2x9W-WRcu6zgkSF75xdvFDYj_InE2swjxC3SqsQT9bIHi3KFnpBURflRudyJ3QhV5twCdYi-gQL3R4VmUoJzeGx9yBU6GCeZfpNP46ic8aCgYKAbcSARUSFQHGX2Mifbg4A39LAGEIpGCXa_xWsA0206', '1771951761', 'eyJhbGciOiJSUzI1NiIsImtpZCI6ImQyNzU0MDdjMzllODAzNmFhNzM1ZWIyYzE3YzU0ODc2MWNlZDZhNjQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI5NTUxMDE5NTEzMDYtdmFiYmRxZzFsZDRsaXUxNnJoN2U4dGZxMzIwZWdudWIuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI5NTUxMDE5NTEzMDYtdmFiYmRxZzFsZDRsaXUxNnJoN2U4dGZxMzIwZWdudWIuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTI1NDE5MTMzNjYxNDkzODkyNTciLCJlbWFpbCI6InB1cnUwa2FkZWtAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImF0X2hhc2giOiJnbkhqQmptWG9FV3RrQko4ZzZoTFdBIiwibmFtZSI6IlB1cnVqaXRoIEthZGVrYXIiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jTHpUSHQwOWk4QVVOaXBmY19XTi0tVElpLW5HRzZ3UURZZHBOMkhrRmVnTlNFcFRZTXA9czk2LWMiLCJnaXZlbl9uYW1lIjoiUHVydWppdGgiLCJmYW1pbHlfbmFtZSI6IkthZGVrYXIiLCJpYXQiOjE3NzE5NDgxNjIsImV4cCI6MTc3MTk1MTc2Mn0.RQyagRgwpB_8MYipHAldzbuPOQfrnk4uL9rNeCwkR5_2E7eIAzjjbSjmCYqfY5qGnPyg11pdYwc5hu1WvkgDuS87EGiDmMm1ZtSu_VRIQ4QZDXMyFEoKOeYtG71jR7nY36eLv9QglMxfNC2LDphLjqOx56kv8-YXR1wxQ0d_Ja1T2p-AdQzgas_QHZSLq7_0G3OXhxoI7mtTIAhc-RwbYV065NOrRxxDOeLBd_pfdRcDDAQaCB_Wmny90ARH4lzcvd9rt4P2HOb6_jOlwy-IIZxvi3hBl47eI5SuaZDu_TCvIFiLvw5sUaIeMiDG1vNqbyFeIvduj9Hp20fOQZMVmg', 'google', '112541913366149389257', '1//056VpoKoRFEIfCgYIARAAGAUSNwF-L9IrcljoS6sGOsiNfpg_xPjhFWp3L1Cz8LGhno-JZ1_JdCPRoPl341EJiXTuUFPvSJq8Emo', 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/youtube.readonly openid', NULL, 'bearer', 'oidc', 'cmm0s6pyg0000i9evqafvt8x4');
INSERT INTO public."Account" ("id", "access_token", "expires_at", "id_token", "provider", "providerAccountId", "refresh_token", "scope", "session_state", "token_type", "type", "userId") VALUES ('cmmnpm00x0004wujl5ws6ji71', 'ya29.a0ATkoCc5YCacL8gldy4NW1H0WIfSiOBcvrtSVM_QGRpgivU09q2xxGt-VNCq8MWbHnQn7-fnmrZubOwUQoF_WFMuCC9sZZOUL8YKGLFVB5aA0IL_waJ8qtceBRHZF-Z5wQfkehXFV8S4Z9a9-dFW9Bn5_d_49mJz8XKYtIo1ko5gM2yJmuTvlTFa3ZGuHMtjVRkMDvtYaCgYKAdcSARQSFQHGX2Miz-nHQuOe_sQT4D20pvcGOA0206', '1773338159', 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjUzMDcyNGQ0OTE3M2EzZWQ2YjRhMDBhYTYzNDQyMDMwMGQ3MmFlNWIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI5NTUxMDE5NTEzMDYtdmFiYmRxZzFsZDRsaXUxNnJoN2U4dGZxMzIwZWdudWIuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI5NTUxMDE5NTEzMDYtdmFiYmRxZzFsZDRsaXUxNnJoN2U4dGZxMzIwZWdudWIuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDcyMzczNjc5MTQ1Mjk1NjkzODciLCJlbWFpbCI6InByYWp3YWxiYWJhbm5hQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoiU3RITkdfZzZnLXpPcHMxOElfTzIwUSIsIm5hbWUiOiJQcmFqd2FsIEIiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSjFnM25tbzZ5WnV6aXd3MEkzNTYxMTJvNEVCUEVUbGQxdy10TEZDQjNDTTJNRlc3cz1zOTYtYyIsImdpdmVuX25hbWUiOiJQcmFqd2FsIiwiZmFtaWx5X25hbWUiOiJCIiwiaWF0IjoxNzczMzM0NTYwLCJleHAiOjE3NzMzMzgxNjB9.R4F1yqq2bJatcrNWyicgk204gwBuDYjzBPC9PdWTbk33s8gZKgFVYzY1A4NRGqrc4XsK6Xu7jUvlF0T7J7n3mvRPFS-diXVHjwQO0OqiUYQKWcAWLxmwhzEE6vJJqXB1DQE9ksxjFiy8OsdA9O28b_SLRaglLzJr8aLYlVVglSPYN_4RyUUWiZNCRTikt_2Jl9k6iCjTJAQE5Erytc834E8fniW9dSugsLf7iTCX2unwr_nMt1TqE01bwRhdynk7VZs73JFLQzIWd3FT0PuuPHfgkYq4Zpf96txBe5BJfo2U16k62bKnc7VVv78xibx0B0nAkIfe4yc5aX92Gss-IQ', 'google', '107237367914529569387', NULL, 'https://www.googleapis.com/auth/userinfo.email openid https://www.googleapis.com/auth/userinfo.profile', NULL, 'Bearer', 'oauth', 'cmmnplzzp0000wujl0o5100qy');

-- Folder: 5 row(s)
INSERT INTO public."Folder" ("id", "createdAt", "description", "parentId", "position", "title", "updatedAt", "userId") VALUES ('cmm80gyex007xdzkx1r01abds', '2026-03-01T17:15:41.450Z', '(empty string)', NULL, '2', 'Code with Harry', '2026-03-18T13:25:30.528Z', 'cmm0s6pyg0000i9evqafvt8x4');
INSERT INTO public."Folder" ("id", "createdAt", "description", "parentId", "position", "title", "updatedAt", "userId") VALUES ('cmm8259fq00d7dzkx4883vumh', '2026-03-01T18:02:34.854Z', 'Automation related videos and playlists', NULL, '3', 'N8N', '2026-03-18T13:25:30.528Z', 'cmm0s6pyg0000i9evqafvt8x4');
INSERT INTO public."Folder" ("id", "createdAt", "description", "parentId", "position", "title", "updatedAt", "userId") VALUES ('cmmmd0qyo0001lkovafvaroht', '2026-03-11T18:15:47.328Z', 'Videos related to my Syllabus·', NULL, '1', 'College - DSCE', '2026-03-18T13:25:30.528Z', 'cmm0s6pyg0000i9evqafvt8x4');
INSERT INTO public."Folder" ("id", "createdAt", "description", "parentId", "position", "title", "updatedAt", "userId") VALUES ('cmmw2qbnb0001229mlbdraecn', '2026-03-18T13:25:26.490Z', '(empty string)', NULL, '0', 'IITM', '2026-03-18T13:25:30.528Z', 'cmm0s6pyg0000i9evqafvt8x4');
INSERT INTO public."Folder" ("id", "createdAt", "description", "parentId", "position", "title", "updatedAt", "userId") VALUES ('folder-webdev-cmm0s6py', '2026-02-26T12:40:21.126Z', 'Frontend and backend courses', NULL, '4', 'Web Development', '2026-03-18T13:25:30.528Z', 'cmm0s6pyg0000i9evqafvt8x4');

-- LibraryItem: 17 row(s)
INSERT INTO public."LibraryItem" ("id", "createdAt", "externalId", "folderId", "metadata", "position", "title", "type", "updatedAt", "userId") VALUES ('cmm80ib67007zdzkxbbf3wpfi', '2026-03-01T17:16:45.199Z', 'cmm80ahf20001dzkxds5zbyno', 'cmm80gyex007xdzkx1r01abds', NULL, '0', 'Sigma Web Development Course - Web Development Tutorials in Hindi 🗿', 'PLAYLIST', '2026-03-01T17:16:45.199Z', 'cmm0s6pyg0000i9evqafvt8x4');
INSERT INTO public."LibraryItem" ("id", "createdAt", "externalId", "folderId", "metadata", "position", "title", "type", "updatedAt", "userId") VALUES ('cmm80ikez0081dzkxrls6uvs4', '2026-03-01T17:16:57.179Z', 'cmm6gxh3g0007akrmcwd1jz2z', 'cmm80gyex007xdzkx1r01abds', NULL, '0', 'Python for Beginners (Full Course) | #100DaysOfCode Programming Tutorial in Hindi', 'PLAYLIST', '2026-03-01T17:16:57.179Z', 'cmm0s6pyg0000i9evqafvt8x4');
INSERT INTO public."LibraryItem" ("id", "createdAt", "externalId", "folderId", "metadata", "position", "title", "type", "updatedAt", "userId") VALUES ('cmm80p2wp0083dzkx9o88hbc5', '2026-03-01T17:22:00.068Z', '1g32IlH3SUs', 'cmm80gyex007xdzkx1r01abds', NULL, '0', 'Lets build a Markdown blog using Next.js, Shadcn, Tailwind, Pieces, Remark & Rehype 🔥', 'VIDEO', '2026-03-01T17:22:00.068Z', 'cmm0s6pyg0000i9evqafvt8x4');
INSERT INTO public."LibraryItem" ("id", "createdAt", "externalId", "folderId", "metadata", "position", "title", "type", "updatedAt", "userId") VALUES ('cmm824cv100d5dzkx2zlnt9gl', '2026-03-01T18:01:53.430Z', 'cmm821l73008pdzkxbgfgyb4k', 'cmm80gyex007xdzkx1r01abds', NULL, '0', 'Next.js Tutorials for Beginners in Hindi', 'PLAYLIST', '2026-03-01T18:01:53.430Z', 'cmm0s6pyg0000i9evqafvt8x4');
INSERT INTO public."LibraryItem" ("id", "createdAt", "externalId", "folderId", "metadata", "position", "title", "type", "updatedAt", "userId") VALUES ('cmm82bc8z00dtdzkxntcti7rl', '2026-03-01T18:07:19.235Z', 'cmm82afoh00d9dzkxhjkuxdqj', 'cmm8259fq00d7dzkx4883vumh', NULL, '0', 'n8n Beginner course', 'PLAYLIST', '2026-03-01T18:07:19.235Z', 'cmm0s6pyg0000i9evqafvt8x4');
INSERT INTO public."LibraryItem" ("id", "createdAt", "externalId", "folderId", "metadata", "position", "title", "type", "updatedAt", "userId") VALUES ('cmm82d0lh00dxdzkxfmrpfgva', '2026-03-01T18:08:37.445Z', 'cmm82d02v00dvdzkxw7376kyi', 'cmm8259fq00d7dzkx4883vumh', NULL, '0', 'Building AI Agents Full Masterclass in Hindi', 'PLAYLIST', '2026-03-01T18:08:37.445Z', 'cmm0s6pyg0000i9evqafvt8x4');
INSERT INTO public."LibraryItem" ("id", "createdAt", "externalId", "folderId", "metadata", "position", "title", "type", "updatedAt", "userId") VALUES ('cmm9alta20003l01gpvmcpuug', '2026-03-02T14:47:10.970Z', 'cmm9alsqi0001l01gu0z3a2vh', NULL, NULL, '0', 'Responsive Portfolio Website Project', 'PLAYLIST', '2026-03-02T14:47:10.970Z', 'cmm0s6pyg0000i9evqafvt8x4');
INSERT INTO public."LibraryItem" ("id", "createdAt", "externalId", "folderId", "metadata", "position", "title", "type", "updatedAt", "userId") VALUES ('cmmmd1zpb00031k8g6qi1m6p8', '2026-03-11T18:16:45.312Z', 'cmmmd1zom00011k8g0wuwl64s', 'cmmmd0qyo0001lkovafvaroht', NULL, '0', 'Engineering Physics - VTU', 'PLAYLIST', '2026-03-11T18:16:45.312Z', 'cmm0s6pyg0000i9evqafvt8x4');
INSERT INTO public."LibraryItem" ("id", "createdAt", "externalId", "folderId", "metadata", "position", "title", "type", "updatedAt", "userId") VALUES ('cmmmd2pfg0003q6u10wkx3nbr', '2026-03-11T18:17:18.652Z', 'cmmmd2pes0001q6u1c97obpz0', 'cmmmd0qyo0001lkovafvaroht', NULL, '0', 'Computer-Aided Engineering Drawing - BCEDK103/203', 'PLAYLIST', '2026-03-11T18:17:18.652Z', 'cmm0s6pyg0000i9evqafvt8x4');
INSERT INTO public."LibraryItem" ("id", "createdAt", "externalId", "folderId", "metadata", "position", "title", "type", "updatedAt", "userId") VALUES ('cmmmd3ba80013q6u1wlk1t170', '2026-03-11T18:17:46.976Z', 'cmmmd3b5x0011q6u1qirutr76', 'cmmmd0qyo0001lkovafvaroht', NULL, '0', '18PHY12/22 - Engineering Physics', 'PLAYLIST', '2026-03-11T18:17:46.976Z', 'cmm0s6pyg0000i9evqafvt8x4');
INSERT INTO public."LibraryItem" ("id", "createdAt", "externalId", "folderId", "metadata", "position", "title", "type", "updatedAt", "userId") VALUES ('cmmmd7a330023q6u1fe0w8tca', '2026-03-11T18:20:52.048Z', 'cmmmd79vj0021q6u1joc4hjya', 'cmmmd0qyo0001lkovafvaroht', NULL, '0', 'Fundamentals of Electronics Engineering (BEC101/BEC201)', 'PLAYLIST', '2026-03-11T18:20:52.048Z', 'cmm0s6pyg0000i9evqafvt8x4');
INSERT INTO public."LibraryItem" ("id", "createdAt", "externalId", "folderId", "metadata", "position", "title", "type", "updatedAt", "userId") VALUES ('cmmmd8ksk003uq6u1drj3i95p', '2026-03-11T18:21:52.581Z', 'cmmmd8ksa003sq6u1fhbl5elh', 'cmmmd0qyo0001lkovafvaroht', NULL, '0', 'Fundamental of Electronics Engineering', 'PLAYLIST', '2026-03-11T18:21:52.581Z', 'cmm0s6pyg0000i9evqafvt8x4');
INSERT INTO public."LibraryItem" ("id", "createdAt", "externalId", "folderId", "metadata", "position", "title", "type", "updatedAt", "userId") VALUES ('cmmrzgybg000713afj2cu5dtw', '2026-03-15T16:43:05.424Z', 'oA8brF3w5XQ', 'cmm80gyex007xdzkx1r01abds', NULL, '0', 'Python Flask Web Development Tutorial in Hindi', 'VIDEO', '2026-03-15T16:43:05.424Z', 'cmm0s6pyg0000i9evqafvt8x4');
INSERT INTO public."LibraryItem" ("id", "createdAt", "externalId", "folderId", "metadata", "position", "title", "type", "updatedAt", "userId") VALUES ('cmmuswyy90003df3hz97w4wj6', '2026-03-17T16:02:54.322Z', 'p1epCuYb5OQ', NULL, NULL, '0', 'Complete SQL in 1 shot for Data analytics in 2025', 'VIDEO', '2026-03-17T16:02:54.322Z', 'cmm0s6pyg0000i9evqafvt8x4');
INSERT INTO public."LibraryItem" ("id", "createdAt", "externalId", "folderId", "metadata", "position", "title", "type", "updatedAt", "userId") VALUES ('cmmw2wekf0005229mgwk1660f', '2026-03-18T13:30:10.239Z', 'cmmw2wds30003229mm4o6y6n3', 'cmmw2qbnb0001229mlbdraecn', NULL, '0', 'MAD I THEORY SESSIONS JAN26', 'PLAYLIST', '2026-03-18T13:30:10.239Z', 'cmm0s6pyg0000i9evqafvt8x4');
INSERT INTO public."LibraryItem" ("id", "createdAt", "externalId", "folderId", "metadata", "position", "title", "type", "updatedAt", "userId") VALUES ('cmmw2xvcm000i229m470sgj3d', '2026-03-18T13:31:18.645Z', 'cmmw2xuvq000g229m6u5gmu93', 'cmmw2qbnb0001229mlbdraecn', NULL, '0', 'MAD I Project Sessions Jan26', 'PLAYLIST', '2026-03-18T13:31:18.645Z', 'cmm0s6pyg0000i9evqafvt8x4');
INSERT INTO public."LibraryItem" ("id", "createdAt", "externalId", "folderId", "metadata", "position", "title", "type", "updatedAt", "userId") VALUES ('cmmw2yca0000q229mfmpbzzdt', '2026-03-18T13:31:40.584Z', 'cmmw2yc2g000o229mnu0zpnf3', 'cmmw2qbnb0001229mlbdraecn', NULL, '0', 'MLF | Live Sessions | T1-2026', 'PLAYLIST', '2026-03-18T13:31:40.584Z', 'cmm0s6pyg0000i9evqafvt8x4');

-- Playlist: 14 row(s)
INSERT INTO public."Playlist" ("id", "channelId", "channelName", "createdAt", "description", "scheduledAt", "thumbnail", "title", "totalDuration", "updatedAt", "userId", "youtubeId") VALUES ('cmm6gxh3g0007akrmcwd1jz2z', 'UCeVMnSShP_Iviwkknt83cww', 'CodeWithHarry', '2026-02-28T15:20:53.878Z', 'Python is one of the most demanded programming languages in the job market. Surprisingly, it is equally easy to learn and master ...', NULL, 'https://i.ytimg.com/vi/7wnove7K-ZQ/mqdefault.jpg', 'Python for Beginners (Full Course) | #100DaysOfCode Programming Tutorial in Hindi', '64632', '2026-03-18T16:40:14.939Z', 'cmm0s6pyg0000i9evqafvt8x4', 'PLu0W_9lII9agwh1XjRt242xIpHhPT2llg');
INSERT INTO public."Playlist" ("id", "channelId", "channelName", "createdAt", "description", "scheduledAt", "thumbnail", "title", "totalDuration", "updatedAt", "userId", "youtubeId") VALUES ('cmm80ahf20001dzkxds5zbyno', 'UCeVMnSShP_Iviwkknt83cww', 'CodeWithHarry', '2026-03-01T17:10:39.520Z', 'Welcome to the Sigma Web Development Course - Web Development Tutorials in Hindi playlist! About this Playlist: Are you ...', NULL, 'https://i.ytimg.com/vi/tVzUXW6siu0/mqdefault.jpg', 'Sigma Web Development Course - Web Development Tutorials in Hindi 🗿', '203456', '2026-03-18T16:40:29.616Z', 'cmm0s6pyg0000i9evqafvt8x4', 'PLu0W_9lII9agq5TrH9XLIKQvv0iaF2X3w');
INSERT INTO public."Playlist" ("id", "channelId", "channelName", "createdAt", "description", "scheduledAt", "thumbnail", "title", "totalDuration", "updatedAt", "userId", "youtubeId") VALUES ('cmm821l73008pdzkxbgfgyb4k', 'UCeVMnSShP_Iviwkknt83cww', 'CodeWithHarry', '2026-03-01T17:59:44.270Z', 'Complete Next.js Course by CodeWithHarry in Hindi - Learn Next.js from scratch for free! 
Next.js is an open-source development framework built on top of Node.js enabling React based web applications functionalities such as server-side rendering and generating static websites. In this free course of nextjs, we will learn alot of things. From what is nextjs to file-based routing to how to connect mongodb to how to deploy a nextjs application!
I will provide all the code written in this course for absolutely free!
This course is in the Hindi language for you to understand each and every concept clearly. 
So, save this playlist and stay tuned for upcoming videos.', NULL, 'https://i.ytimg.com/vi/DZKOunP-WLQ/maxresdefault.jpg', 'Next.js Tutorials for Beginners in Hindi', '93775', '2026-03-18T16:40:37.732Z', 'cmm0s6pyg0000i9evqafvt8x4', 'PLu0W_9lII9agtWvR_TZdb_r0dNI8-lDwG');
INSERT INTO public."Playlist" ("id", "channelId", "channelName", "createdAt", "description", "scheduledAt", "thumbnail", "title", "totalDuration", "updatedAt", "userId", "youtubeId") VALUES ('cmm82afoh00d9dzkxhjkuxdqj', 'UCiHVTkJtWSdc9N3h0nUGWLg', 'n8n', '2026-03-01T18:06:37.021Z', '(empty string)', NULL, 'https://i.ytimg.com/vi/4BVTkqbn_tY/maxresdefault.jpg', 'n8n Beginner course', '7808', '2026-03-18T16:40:16.277Z', 'cmm0s6pyg0000i9evqafvt8x4', 'PLlET0GsrLUL59YbxstZE71WszP3pVnZfI');
INSERT INTO public."Playlist" ("id", "channelId", "channelName", "createdAt", "description", "scheduledAt", "thumbnail", "title", "totalDuration", "updatedAt", "userId", "youtubeId") VALUES ('cmm82d02v00dvdzkxw7376kyi', 'UCjECA8ZHP52yFjKyRW4-8Hw', 'AI Learners India', '2026-03-01T18:08:36.775Z', 'This playlist is a dedicated playlist of learning Ai Agents.. 
🎓 AI Agents Full Masterclass in Hindi | Learn AI Automation from Scratch (2025 Edition)
Welcome to the Ultimate AI Agents Masterclass in Hindi – your go-to playlist for learning how to build, use, and master AI agents like ChatGPT, Auto-GPT, BabyAGI, and more. Whether you’re a complete beginner or already dabbling in AI, this series will take you from zero to hero in the world of intelligent automation.

🚀 What You''ll Learn in This Playlist:

✅ What Are AI Agents?
Understand the core concepts, use cases, and why agents are the future of AI-powered work.

✅ Top AI Agent Frameworks & Tools
Get hands-on with LangChain, Auto-GPT, CrewAI, BabyAGI, and other trending tools in 2025.

✅ Memory, Planning & Decision Making
Explore how agents think, store memory, and take logical decisions — just like humans (but better).

✅ Build Your Own AI Agent
Step-by-step coding tutorials in Python to create your own AI Agent using LLMs and APIs.

✅ Real-world AI Automation Projects
Email responders, social media bots, research agents, task managers — build useful tools with real value.

✅ Agent vs Traditional Automation
Deep dive into how AI agents are different from basic automations and why they’re game changers.

✅ Future Trends & Career Opportunities
Where is AI automation heading? Which skills will be in demand in 2025 and beyond?

🎯 Who Should Watch This Playlist?
Students & Beginners who want to learn AI in Hindi

Freelancers & Developers looking to upgrade their skills

Entrepreneurs & Startup Builders exploring AI use cases

Content Creators & Automation Enthusiasts

💎 Playlist Benefits:
🔹 100% Beginner-Friendly – explained in Hindi for easy learning
🔹 Code-Along Tutorials with GitHub access
🔹 Practical Projects & Real Use Cases
🔹 Lifetime Value – binge-worthy content with future relevance
🔹 Active Discord Community for Support & Q&A

AI Agent Tutorial Hindi, Auto-GPT Hindi, LangChain Hindi, Build AI Assistant, AI Automation 2025, Learn AI in Hindi, Python AI Projects, BabyAGI Explained, CrewAI Tutorial, ChatGPT Automation, Hindi AI Course

Subscribe, binge the full playlist, and start building powerful AI tools today — all in Hindi, all simplified.
Don’t just use AI… create it.', NULL, 'https://i.ytimg.com/vi/dhhVxJ_qUPc/maxresdefault.jpg', 'Building AI Agents Full Masterclass in Hindi', '33839', '2026-03-18T16:40:39.231Z', 'cmm0s6pyg0000i9evqafvt8x4', 'PLwdhOAfEpxTaHqf_o0waIy-EPz0PWEvFh');
INSERT INTO public."Playlist" ("id", "channelId", "channelName", "createdAt", "description", "scheduledAt", "thumbnail", "title", "totalDuration", "updatedAt", "userId", "youtubeId") VALUES ('cmm9alsqi0001l01gu0z3a2vh', 'UC29ju8bIPH5as8OGnQzwJyA', 'Traversy Media', '2026-03-02T14:47:10.248Z', '(empty string)', NULL, 'https://i.ytimg.com/vi/gYzHS-n2gqU/maxresdefault.jpg', 'Responsive Portfolio Website Project', '10097', '2026-03-18T16:40:20.734Z', 'cmm0s6pyg0000i9evqafvt8x4', 'PLillGF-RfqbYoGoCjKoMOkVznV6aSXKzU');
INSERT INTO public."Playlist" ("id", "channelId", "channelName", "createdAt", "description", "scheduledAt", "thumbnail", "title", "totalDuration", "updatedAt", "userId", "youtubeId") VALUES ('cmmmd1zom00011k8g0wuwl64s', 'UC5AV_g3KVLOEuvmezDe2QOA', 'Dr. Nagaraja D - Physics For You', '2026-03-11T18:16:45.286Z', 'Here you will get  detailed videos on Engineering Physics as per VTU syllabus', NULL, 'https://i.ytimg.com/vi/wSnznJrVDsY/maxresdefault.jpg', 'Engineering Physics - VTU', '35962', '2026-03-18T16:40:17.979Z', 'cmm0s6pyg0000i9evqafvt8x4', 'PLR8xTDTf1X_ctkVglDEjegg0syyuyy5fO');
INSERT INTO public."Playlist" ("id", "channelId", "channelName", "createdAt", "description", "scheduledAt", "thumbnail", "title", "totalDuration", "updatedAt", "userId", "youtubeId") VALUES ('cmmmd2pes0001q6u1c97obpz0', 'UCj-maMUNWopf_RBAx64tMrw', 'JnanaMITra - ಜ್ಞಾನಮಿತ್ರ', '2026-03-11T18:17:18.628Z', 'First Year Subject for all branch - VTU', NULL, 'https://i.ytimg.com/vi/FaXh6Suwld0/maxresdefault.jpg', 'Computer-Aided Engineering Drawing - BCEDK103/203', '62530', '2026-03-18T16:40:29.893Z', 'cmm0s6pyg0000i9evqafvt8x4', 'PLgdFAtuRW5n56fmHolsp_2B4P4a2YN6De');
INSERT INTO public."Playlist" ("id", "channelId", "channelName", "createdAt", "description", "scheduledAt", "thumbnail", "title", "totalDuration", "updatedAt", "userId", "youtubeId") VALUES ('cmmmd3b5x0011q6u1qirutr76', 'UCjb6EQ5PeqYF41u8rCliBHw', 'VTU e-Shikshana Programme', '2026-03-11T18:17:46.822Z', '(empty string)', NULL, 'https://i.ytimg.com/vi/2hvl8bNSv0w/mqdefault.jpg', '18PHY12/22 - Engineering Physics', '66398', '2026-03-18T16:40:31.373Z', 'cmm0s6pyg0000i9evqafvt8x4', 'PLcwp2fRcIXJVaQ3AuNElHIPGTBknaCSMe');
INSERT INTO public."Playlist" ("id", "channelId", "channelName", "createdAt", "description", "scheduledAt", "thumbnail", "title", "totalDuration", "updatedAt", "userId", "youtubeId") VALUES ('cmmmd79vj0021q6u1joc4hjya', 'UCj86U7FT8O4JqXC-pfKFLIQ', 'Dr. Vaibhav Jain', '2026-03-11T18:20:51.775Z', 'AKTU,  B.Tech- I Year, All Branches (As per Latest Syllabus 22-23)
Complete Playlist:
https://www.youtube.com/watch?v=9HLQTpS1Hs4&list=PL0c0N7xv8s06iL0pUc8VXGH_v-vbGOSv4', NULL, 'https://i.ytimg.com/vi/9HLQTpS1Hs4/maxresdefault.jpg', 'Fundamentals of Electronics Engineering (BEC101/BEC201)', '49590', '2026-03-18T16:40:33.377Z', 'cmm0s6pyg0000i9evqafvt8x4', 'PL0c0N7xv8s06iL0pUc8VXGH_v-vbGOSv4');
INSERT INTO public."Playlist" ("id", "channelId", "channelName", "createdAt", "description", "scheduledAt", "thumbnail", "title", "totalDuration", "updatedAt", "userId", "youtubeId") VALUES ('cmmmd8ksa003sq6u1fhbl5elh', 'UC21EfTFTG00cR2umMz0pPHw', 'Fundamental of Electronics Engineering', '2026-03-11T18:21:52.570Z', 'This video lecture series consists of thirty-eight video lectures on Fundamental of Electronics Engineering for UG students of Electrical & Electronics Engineering, Electronics & Communication Engineering, Electrical Engineering, Computer Science & Engineering, and other Departments also.', NULL, 'https://i.ytimg.com/vi/CPGSN39QdSA/maxresdefault.jpg', 'Fundamental of Electronics Engineering', '97210', '2026-03-18T16:40:19.536Z', 'cmm0s6pyg0000i9evqafvt8x4', 'PLRB8yWEKyORwj7JAqi2DAe4den_LAEDKu');
INSERT INTO public."Playlist" ("id", "channelId", "channelName", "createdAt", "description", "scheduledAt", "thumbnail", "title", "totalDuration", "updatedAt", "userId", "youtubeId") VALUES ('cmmw2wds30003229mm4o6y6n3', 'UC4QhTK16K8skVTJHaeDV3mw', 'MAD I', '2026-03-18T13:30:09.219Z', '(empty string)', NULL, 'https://i.ytimg.com/vi/T_qCgQ9dxVA/maxresdefault.jpg', 'MAD I THEORY SESSIONS JAN26', '73451', '2026-03-18T16:40:22.264Z', 'cmm0s6pyg0000i9evqafvt8x4', 'PLAhdwKzwjRu3is2y5LZc3HjA0KaWkCuvm');
INSERT INTO public."Playlist" ("id", "channelId", "channelName", "createdAt", "description", "scheduledAt", "thumbnail", "title", "totalDuration", "updatedAt", "userId", "youtubeId") VALUES ('cmmw2xuvq000g229m6u5gmu93', 'UC4QhTK16K8skVTJHaeDV3mw', 'MAD I', '2026-03-18T13:31:18.039Z', '(empty string)', NULL, 'https://i.ytimg.com/vi/qTTeM9kaug4/maxresdefault.jpg', 'MAD I Project Sessions Jan26', '32062', '2026-03-18T16:40:23.855Z', 'cmm0s6pyg0000i9evqafvt8x4', 'PLAhdwKzwjRu0-bx2Ij4YTHCstr_5Qxsh8');
INSERT INTO public."Playlist" ("id", "channelId", "channelName", "createdAt", "description", "scheduledAt", "thumbnail", "title", "totalDuration", "updatedAt", "userId", "youtubeId") VALUES ('cmmw2yc2g000o229mnu0zpnf3', 'UCGWoBJTgaI2XTxfM2HO0i9A', 'ML Foundations', '2026-03-18T13:31:40.312Z', 'Instructor live sessions for T1-2026 in the MLF course.', NULL, 'https://i.ytimg.com/vi/NFDpqYwivZk/maxresdefault.jpg', 'MLF | Live Sessions | T1-2026', '95272', '2026-03-18T16:40:34.943Z', 'cmm0s6pyg0000i9evqafvt8x4', 'PL6duHAYny9nPsLXb0rPGfTThO0ALDpYOQ');

-- Video: 25 row(s)
INSERT INTO public."Video" ("id", "createdAt", "description", "duration", "playlistId", "position", "scheduledAt", "thumbnail", "title", "updatedAt", "userId", "youtubeId") VALUES ('cmm6gxhjk0009akrmjsk0vrgi', '2026-02-28T15:20:54.798Z', 'Python Udemy Course: https://goharry.in/python
Get this course at 90% Discount if you use this link

Code Backup Repository: https://github.com/CodeWithHarry/100-days-of-code-youtube
#100daysofcode 

Python is one of the most demanded programming languages in the job market. Surprisingly, it is equally easy to learn and master  Python. This Python tutorial for absolute beginners in Hindi series will focus on teaching you Python concepts from the ground up.
🔥 XStore – Premium WordPress theme for eCommerce success! https://1.envato.market/2rXmmA
Access the Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agwh1XjRt242xIpHhPT2llg
Link to the Repl: https://replit.com/@codewithharry/01-Day1-Intro-to-Python#main.py
Join Replit the browser-based IDE used in this course - https://join.replit.com/code-with-harry-100-doc

 

►Learn in One Video[++]:
Python[15 Hr]: https://www.youtube.com/watch?v=gfDE2a7MKjA&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python Advance[3.5 Hr]: https://www.youtube.com/watch?v=61a7UkDO50s&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[1 Hr]: https://www.youtube.com/watch?v=qHJjMvHLJdg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[2 Hr]: https://www.youtube.com/watch?v=ihk_Xglr164&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[15 Min]:https://www.youtube.com/watch?v=fr1f84rg4Nw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JavaScript[1 Hr]: https://www.youtube.com/watch?v=onbBV0uFVpo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
C[1.3 Hr]-https://www.youtube.com/watch?v=YXcgD8hRHYY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[1 Hr]: https://www.youtube.com/watch?v=xW7ro3lwaCI&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[2.3 Hr]:https://www.youtube.com/watch?v=1SnPKhCdlsU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[Project]- https://www.youtube.com/watch?v=-al2bECumKg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
HTML[30 Min]:https://www.youtube.com/watch?v=E3ByCRqE7Lo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[8.5 Hr]:https://www.youtube.com/watch?v=Edsxf_NBFrw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[1.4 Hr]:https://www.youtube.com/watch?v=u5-K_ua9sOw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Wordpress[3.2 Hr]:https://www.youtube.com/watch?v=GlLRYml8mCY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Angular[2 Hr]:https://www.youtube.com/watch?v=0LhBvp8qpro&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Java[2.3 Hr]:https://www.youtube.com/watch?v=rV_3Lewxx6o&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Web Scraping[1 Hr]:https://www.youtube.com/watch?v=uufDGjTuq34&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
MongoDB[2 Hr]:https://www.youtube.com/watch?v=oSIv-E60NiU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Numpy[1 Hr]:https://www.youtube.com/watch?v=Rbh1rieb3zc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Android Dev[12 Hr]- https://www.youtube.com/watch?v=mXjZQX3UzOs
Linux[1 Hr]:https://www.youtube.com/watch?v=_tCY-c-sPZc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JQuery[1.1 Hr]:https://www.youtube.com/watch?v=YFlx1C8XwR0&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Git and GitHub[1.1 Hr]:https://www.youtube.com/watch?v=gwWKnnCMQ5c&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7

►Complete course [playlist]:
React: https://www.youtube.com/playlist?list=PLu0W_9lII9agx66oZnT6IyhcMIbUMNMdt
Python-https://www.youtube.com/playlist?list=PLu0W_9lII9agICnT8t4iYVSZ3eykIAOME
OOP Python-https://www.youtube.com/playlist?list=PLu0W_9lII9ahfRrhFcoB-4lpp9YaBmdCP
Java:https://www.youtube.com/playlist?list=PLu0W_9lII9agS67Uits0UnJyrYiXhDS6q
JavaScript- https://www.youtube.com/playlist?list=PLu0W_9lII9ajyk081To1Cbt2eI5913SsL
PHP-https://www.youtube.com/playlist?list=PLu0W_9lII9aikXkRE0WxDt1vozo3hnmtR
C-https://www.youtube.com/playlist?list=PLu0W_9lII9aiXlHcLx-mDH1Qul38wD3aR
C++-https://www.youtube.com/playlist?list=PLu0W_9lII9agpFUAlPFe_VNSlXW5uE0YL
Git & GitHub-https://www.youtube.com/playlist?list=PLu0W_9lII9ahVQekD7ePHmnirTePXwIln
Android Dev- https://www.youtube.com/playlist?list=PLu0W_9lII9aiL0kysYlfSOUgY5rNlOhUd
Python GUI- https://www.youtube.com/playlist?list=PLu0W_9lII9ajLcqRcj4PoEihkukF_OTzA
Web Development- https://www.youtube.com/playlist?list=PLu0W_9lII9agiCUZYRsvtGTXdxkzPyItg
Python Django:https://www.youtube.com/playlist?list=PLu0W_9lII9ah7DDtYtflgwMwpT3xmjXY9
Projects Using HTML, CSS & Javascript- https://www.youtube.com/playlist?list=PLu0W_9lII9aiQiOwthuSvinxoflmhRxM3
Data Structure and Algo:https://www.youtube.com/playlist?list=PLu0W_9lII9ahIappRPN0MCAgtOu3lQjQi 

Follow Me On Social Media
►Website (created using Django Rest & Angular): https://www.codewithharry.com
►Facebook: https://www.facebook.com/CodeWithHarry
►Instagram: https://www.instagram.com/codewithharry/ 
Twitter: https://twitter.com/CodeWithHarry
Comment "#HarryBhai" if you read this 😉😉', '710', 'cmm6gxh3g0007akrmcwd1jz2z', '0', NULL, 'https://i.ytimg.com/vi/7wnove7K-ZQ/maxresdefault.jpg', 'Introduction to Programming & Python | Python Tutorial - Day #1', '2026-02-28T15:20:54.798Z', 'cmm0s6pyg0000i9evqafvt8x4', '7wnove7K-ZQ');
INSERT INTO public."Video" ("id", "createdAt", "description", "duration", "playlistId", "position", "scheduledAt", "thumbnail", "title", "updatedAt", "userId", "youtubeId") VALUES ('cmm6gxi0a000bakrm8e1ibewt', '2026-02-28T15:20:55.402Z', 'Python Udemy Course: https://goharry.in/python
Get this course at 90% Discount if you use this link

Python is one of the most demanded programming languages in the job market. Surprisingly, it is equally easy to learn and master  Python. This python tutorial for absolute beginners in Hindi series will focus on teaching you python concepts from the ground up. Today we will see some of the mindblowing python programs, I created
Access the Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agwh1XjRt242xIpHhPT2llg
Link to the Repl: https://replit.com/@codewithharry/02-Day2-Application-of-Python#main.py
Join Replit the browser-based IDE used in this course - https://join.replit.com/code-with-harry-100-doc
►Checkout my English channel here: https://www.youtube.com/channel/UC7btqG2Ww0_2LwuQxpvo2HQ
►Instagram: www.instagram.com/codewithharry

python, C, C++, Java, JavaScript and Other Cheetsheets [++]:
Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agrsRZjFECeFuWY5ev2pQlk

►Learn in One Video[++]:
Python[15 Hr]: https://www.youtube.com/watch?v=gfDE2a7MKjA&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python Advance[3.5 Hr]: https://www.youtube.com/watch?v=61a7UkDO50s&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[1 Hr]: https://www.youtube.com/watch?v=qHJjMvHLJdg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[2 Hr]: https://www.youtube.com/watch?v=ihk_Xglr164&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[15 Min]:https://www.youtube.com/watch?v=fr1f84rg4Nw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JavaScript[1 Hr]: https://www.youtube.com/watch?v=onbBV0uFVpo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
C[1.3 Hr]-https://www.youtube.com/watch?v=YXcgD8hRHYY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[1 Hr]: https://www.youtube.com/watch?v=xW7ro3lwaCI&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[2.3 Hr]:https://www.youtube.com/watch?v=1SnPKhCdlsU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[Project]- https://www.youtube.com/watch?v=-al2bECumKg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
HTML[30 Min]:https://www.youtube.com/watch?v=E3ByCRqE7Lo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[8.5 Hr]:https://www.youtube.com/watch?v=Edsxf_NBFrw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[1.4 Hr]:https://www.youtube.com/watch?v=u5-K_ua9sOw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Wordpress[3.2 Hr]:https://www.youtube.com/watch?v=GlLRYml8mCY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Angular[2 Hr]:https://www.youtube.com/watch?v=0LhBvp8qpro&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Java[2.3 Hr]:https://www.youtube.com/watch?v=rV_3Lewxx6o&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Web Scraping[1 Hr]:https://www.youtube.com/watch?v=uufDGjTuq34&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
MongoDB[2 Hr]:https://www.youtube.com/watch?v=oSIv-E60NiU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Numpy[1 Hr]:https://www.youtube.com/watch?v=Rbh1rieb3zc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Android Dev[12 Hr]- https://www.youtube.com/watch?v=mXjZQX3UzOs
Linux[1 Hr]:https://www.youtube.com/watch?v=_tCY-c-sPZc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JQuery[1.1 Hr]:https://www.youtube.com/watch?v=YFlx1C8XwR0&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Git and GitHub[1.1 Hr]:https://www.youtube.com/watch?v=gwWKnnCMQ5c&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7

►Complete course [playlist]:
React: https://www.youtube.com/playlist?list=PLu0W_9lII9agx66oZnT6IyhcMIbUMNMdt
Python-https://www.youtube.com/playlist?list=PLu0W_9lII9agICnT8t4iYVSZ3eykIAOME
OOP Python-https://www.youtube.com/playlist?list=PLu0W_9lII9ahfRrhFcoB-4lpp9YaBmdCP
Java:https://www.youtube.com/playlist?list=PLu0W_9lII9agS67Uits0UnJyrYiXhDS6q
JavaScript- https://www.youtube.com/playlist?list=PLu0W_9lII9ajyk081To1Cbt2eI5913SsL
PHP-https://www.youtube.com/playlist?list=PLu0W_9lII9aikXkRE0WxDt1vozo3hnmtR
C-https://www.youtube.com/playlist?list=PLu0W_9lII9aiXlHcLx-mDH1Qul38wD3aR
C++-https://www.youtube.com/playlist?list=PLu0W_9lII9agpFUAlPFe_VNSlXW5uE0YL
Git & GitHub-https://www.youtube.com/playlist?list=PLu0W_9lII9ahVQekD7ePHmnirTePXwIln
Android Dev- https://www.youtube.com/playlist?list=PLu0W_9lII9aiL0kysYlfSOUgY5rNlOhUd
Python GUI- https://www.youtube.com/playlist?list=PLu0W_9lII9ajLcqRcj4PoEihkukF_OTzA
Web Development- https://www.youtube.com/playlist?list=PLu0W_9lII9agiCUZYRsvtGTXdxkzPyItg
Python Django:https://www.youtube.com/playlist?list=PLu0W_9lII9ah7DDtYtflgwMwpT3xmjXY9
Projects Using HTML, CSS & Javascript- https://www.youtube.com/playlist?list=PLu0W_9lII9aiQiOwthuSvinxoflmhRxM3
Data Structure and Algo:https://www.youtube.com/playlist?list=PLu0W_9lII9ahIappRPN0MCAgtOu3lQjQi 

Follow Me On Social Media
►Website (created using Django Rest & Angular): https://www.codewithharry.com
►Facebook: https://www.facebook.com/CodeWithHarry
►Instagram: https://www.instagram.com/codewithharry/ 
Twitter: https://twitter.com/CodeWithHarry
Comment "#HarryBhai" if you read this 😉😉', '518', 'cmm6gxh3g0007akrmcwd1jz2z', '1', NULL, 'https://i.ytimg.com/vi/Tto8TS-fJQU/maxresdefault.jpg', 'Some Amazing Python Programs - The Power of Python | Python Tutorial - Day #2', '2026-02-28T15:20:55.402Z', 'cmm0s6pyg0000i9evqafvt8x4', 'Tto8TS-fJQU');
INSERT INTO public."Video" ("id", "createdAt", "description", "duration", "playlistId", "position", "scheduledAt", "thumbnail", "title", "updatedAt", "userId", "youtubeId") VALUES ('cmm6gxifh000dakrms5k1gvy1', '2026-02-28T15:20:55.949Z', 'Python Udemy Course: https://goharry.in/python
Get this course at 90% Discount if you use this link

Python is one of the most demanded programming languages in the job market. Surprisingly, it is equally easy to learn and master  Python. This python tutorial for absolute beginners in Hindi series will focus on teaching you python concepts from the ground up. Today we will see what modules are, how package management is done in python and how to use pip to install a package in python.
Access the Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agwh1XjRt242xIpHhPT2llg
Link to the Repl: https://replit.com/@codewithharry/03-Day3-Modules-and-Pip#main.py
Join Replit the browser-based IDE used in this course - https://join.replit.com/code-with-harry-100-doc
►Checkout my English channel here: https://www.youtube.com/channel/UC7btqG2Ww0_2LwuQxpvo2HQ
►Instagram: www.instagram.com/codewithharry

python, C, C++, Java, JavaScript and Other Cheetsheets [++]:
Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agrsRZjFECeFuWY5ev2pQlk

►Learn in One Video[++]:
Python[15 Hr]: https://www.youtube.com/watch?v=gfDE2a7MKjA&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python Advance[3.5 Hr]: https://www.youtube.com/watch?v=61a7UkDO50s&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[1 Hr]: https://www.youtube.com/watch?v=qHJjMvHLJdg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[2 Hr]: https://www.youtube.com/watch?v=ihk_Xglr164&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[15 Min]:https://www.youtube.com/watch?v=fr1f84rg4Nw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JavaScript[1 Hr]: https://www.youtube.com/watch?v=onbBV0uFVpo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
C[1.3 Hr]-https://www.youtube.com/watch?v=YXcgD8hRHYY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[1 Hr]: https://www.youtube.com/watch?v=xW7ro3lwaCI&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[2.3 Hr]:https://www.youtube.com/watch?v=1SnPKhCdlsU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[Project]- https://www.youtube.com/watch?v=-al2bECumKg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
HTML[30 Min]:https://www.youtube.com/watch?v=E3ByCRqE7Lo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[8.5 Hr]:https://www.youtube.com/watch?v=Edsxf_NBFrw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[1.4 Hr]:https://www.youtube.com/watch?v=u5-K_ua9sOw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Wordpress[3.2 Hr]:https://www.youtube.com/watch?v=GlLRYml8mCY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Angular[2 Hr]:https://www.youtube.com/watch?v=0LhBvp8qpro&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Java[2.3 Hr]:https://www.youtube.com/watch?v=rV_3Lewxx6o&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Web Scraping[1 Hr]:https://www.youtube.com/watch?v=uufDGjTuq34&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
MongoDB[2 Hr]:https://www.youtube.com/watch?v=oSIv-E60NiU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Numpy[1 Hr]:https://www.youtube.com/watch?v=Rbh1rieb3zc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Android Dev[12 Hr]- https://www.youtube.com/watch?v=mXjZQX3UzOs
Linux[1 Hr]:https://www.youtube.com/watch?v=_tCY-c-sPZc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JQuery[1.1 Hr]:https://www.youtube.com/watch?v=YFlx1C8XwR0&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Git and GitHub[1.1 Hr]:https://www.youtube.com/watch?v=gwWKnnCMQ5c&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7

►Complete course [playlist]:
React: https://www.youtube.com/playlist?list=PLu0W_9lII9agx66oZnT6IyhcMIbUMNMdt
Python-https://www.youtube.com/playlist?list=PLu0W_9lII9agICnT8t4iYVSZ3eykIAOME
OOP Python-https://www.youtube.com/playlist?list=PLu0W_9lII9ahfRrhFcoB-4lpp9YaBmdCP
Java:https://www.youtube.com/playlist?list=PLu0W_9lII9agS67Uits0UnJyrYiXhDS6q
JavaScript- https://www.youtube.com/playlist?list=PLu0W_9lII9ajyk081To1Cbt2eI5913SsL
PHP-https://www.youtube.com/playlist?list=PLu0W_9lII9aikXkRE0WxDt1vozo3hnmtR
C-https://www.youtube.com/playlist?list=PLu0W_9lII9aiXlHcLx-mDH1Qul38wD3aR
C++-https://www.youtube.com/playlist?list=PLu0W_9lII9agpFUAlPFe_VNSlXW5uE0YL
Git & GitHub-https://www.youtube.com/playlist?list=PLu0W_9lII9ahVQekD7ePHmnirTePXwIln
Android Dev- https://www.youtube.com/playlist?list=PLu0W_9lII9aiL0kysYlfSOUgY5rNlOhUd
Python GUI- https://www.youtube.com/playlist?list=PLu0W_9lII9ajLcqRcj4PoEihkukF_OTzA
Web Development- https://www.youtube.com/playlist?list=PLu0W_9lII9agiCUZYRsvtGTXdxkzPyItg
Python Django:https://www.youtube.com/playlist?list=PLu0W_9lII9ah7DDtYtflgwMwpT3xmjXY9
Projects Using HTML, CSS & Javascript- https://www.youtube.com/playlist?list=PLu0W_9lII9aiQiOwthuSvinxoflmhRxM3
Data Structure and Algo:https://www.youtube.com/playlist?list=PLu0W_9lII9ahIappRPN0MCAgtOu3lQjQi 

Follow Me On Social Media
►Website (created using Django Rest & Angular): https://www.codewithharry.com
►Facebook: https://www.facebook.com/CodeWithHarry
►Instagram: https://www.instagram.com/codewithharry/ 
Twitter: https://twitter.com/CodeWithHarry
Comment "#HarryBhai" if you read this 😉😉', '761', 'cmm6gxh3g0007akrmcwd1jz2z', '2', NULL, 'https://i.ytimg.com/vi/xwKO_y2gHxQ/maxresdefault.jpg', 'Modules and Pip | Python Tutorial - Day #3', '2026-02-28T15:20:55.949Z', 'cmm0s6pyg0000i9evqafvt8x4', 'xwKO_y2gHxQ');
INSERT INTO public."Video" ("id", "createdAt", "description", "duration", "playlistId", "position", "scheduledAt", "thumbnail", "title", "updatedAt", "userId", "youtubeId") VALUES ('cmm6gxio7000fakrmlobuad57', '2026-02-28T15:20:56.264Z', 'Python Udemy Course: https://goharry.in/python
Get this course at 90% Discount if you use this link

Python is one of the most demanded programming languages in the job market. Surprisingly, it is equally easy to learn and master  Python. This python tutorial for absolute beginners in Hindi series will focus on teaching you python concepts from the ground up. Today we will see what modules are, how package management is done in python, and how to use pip to install a package in python.
Access the Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agwh1XjRt242xIpHhPT2llg
Link to the Repl: https://replit.com/@codewithharry/04-Day4-Our-First-Program#main.py
Join Replit the browser-based IDE used in this course - https://join.replit.com/code-with-harry-100-doc
►Checkout my English channel here: https://www.youtube.com/channel/UC7btqG2Ww0_2LwuQxpvo2HQ
►Instagram: www.instagram.com/codewithharry

python, C, C++, Java, JavaScript and Other Cheetsheets [++]:
Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agrsRZjFECeFuWY5ev2pQlk

►Learn in One Video[++]:
Python[15 Hr]: https://www.youtube.com/watch?v=gfDE2a7MKjA&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python Advance[3.5 Hr]: https://www.youtube.com/watch?v=61a7UkDO50s&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[1 Hr]: https://www.youtube.com/watch?v=qHJjMvHLJdg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[2 Hr]: https://www.youtube.com/watch?v=ihk_Xglr164&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[15 Min]:https://www.youtube.com/watch?v=fr1f84rg4Nw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JavaScript[1 Hr]: https://www.youtube.com/watch?v=onbBV0uFVpo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
C[1.3 Hr]-https://www.youtube.com/watch?v=YXcgD8hRHYY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[1 Hr]: https://www.youtube.com/watch?v=xW7ro3lwaCI&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[2.3 Hr]:https://www.youtube.com/watch?v=1SnPKhCdlsU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[Project]- https://www.youtube.com/watch?v=-al2bECumKg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
HTML[30 Min]:https://www.youtube.com/watch?v=E3ByCRqE7Lo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[8.5 Hr]:https://www.youtube.com/watch?v=Edsxf_NBFrw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[1.4 Hr]:https://www.youtube.com/watch?v=u5-K_ua9sOw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Wordpress[3.2 Hr]:https://www.youtube.com/watch?v=GlLRYml8mCY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Angular[2 Hr]:https://www.youtube.com/watch?v=0LhBvp8qpro&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Java[2.3 Hr]:https://www.youtube.com/watch?v=rV_3Lewxx6o&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Web Scraping[1 Hr]:https://www.youtube.com/watch?v=uufDGjTuq34&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
MongoDB[2 Hr]:https://www.youtube.com/watch?v=oSIv-E60NiU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Numpy[1 Hr]:https://www.youtube.com/watch?v=Rbh1rieb3zc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Android Dev[12 Hr]- https://www.youtube.com/watch?v=mXjZQX3UzOs
Linux[1 Hr]:https://www.youtube.com/watch?v=_tCY-c-sPZc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JQuery[1.1 Hr]:https://www.youtube.com/watch?v=YFlx1C8XwR0&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Git and GitHub[1.1 Hr]:https://www.youtube.com/watch?v=gwWKnnCMQ5c&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7

►Complete course [playlist]:
React: https://www.youtube.com/playlist?list=PLu0W_9lII9agx66oZnT6IyhcMIbUMNMdt
Python-https://www.youtube.com/playlist?list=PLu0W_9lII9agICnT8t4iYVSZ3eykIAOME
OOP Python-https://www.youtube.com/playlist?list=PLu0W_9lII9ahfRrhFcoB-4lpp9YaBmdCP
Java:https://www.youtube.com/playlist?list=PLu0W_9lII9agS67Uits0UnJyrYiXhDS6q
JavaScript- https://www.youtube.com/playlist?list=PLu0W_9lII9ajyk081To1Cbt2eI5913SsL
PHP-https://www.youtube.com/playlist?list=PLu0W_9lII9aikXkRE0WxDt1vozo3hnmtR
C-https://www.youtube.com/playlist?list=PLu0W_9lII9aiXlHcLx-mDH1Qul38wD3aR
C++-https://www.youtube.com/playlist?list=PLu0W_9lII9agpFUAlPFe_VNSlXW5uE0YL
Git & GitHub-https://www.youtube.com/playlist?list=PLu0W_9lII9ahVQekD7ePHmnirTePXwIln
Android Dev- https://www.youtube.com/playlist?list=PLu0W_9lII9aiL0kysYlfSOUgY5rNlOhUd
Python GUI- https://www.youtube.com/playlist?list=PLu0W_9lII9ajLcqRcj4PoEihkukF_OTzA
Web Development- https://www.youtube.com/playlist?list=PLu0W_9lII9agiCUZYRsvtGTXdxkzPyItg
Python Django:https://www.youtube.com/playlist?list=PLu0W_9lII9ah7DDtYtflgwMwpT3xmjXY9
Projects Using HTML, CSS & Javascript- https://www.youtube.com/playlist?list=PLu0W_9lII9aiQiOwthuSvinxoflmhRxM3
Data Structure and Algo:https://www.youtube.com/playlist?list=PLu0W_9lII9ahIappRPN0MCAgtOu3lQjQi 

Follow Me On Social Media
►Website (created using Django Rest & Angular): https://www.codewithharry.com
►Facebook: https://www.facebook.com/CodeWithHarry
►Instagram: https://www.instagram.com/codewithharry/ 
Twitter: https://twitter.com/CodeWithHarry
Comment "#HarryBhai" if you read this 😉😉', '444', 'cmm6gxh3g0007akrmcwd1jz2z', '3', NULL, 'https://i.ytimg.com/vi/7IWOYhfAcVg/maxresdefault.jpg', 'Our First Python Program | Python Tutorial - Day #4', '2026-02-28T15:20:56.264Z', 'cmm0s6pyg0000i9evqafvt8x4', '7IWOYhfAcVg');
INSERT INTO public."Video" ("id", "createdAt", "description", "duration", "playlistId", "position", "scheduledAt", "thumbnail", "title", "updatedAt", "userId", "youtubeId") VALUES ('cmm6gxjmt000hakrmn2rz6bap', '2026-02-28T15:20:57.509Z', 'Python Udemy Course: https://goharry.in/python
Get this course at 90% Discount if you use this link

Python is one of the most demanded programming languages in the job market. Surprisingly, it is equally easy to learn and master  Python. This python tutorial for absolute beginners in Hindi series will focus on teaching you python concepts from the ground up. 
Access the Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agwh1XjRt242xIpHhPT2llg
Link to the Repl: https://replit.com/@codewithharry/05-Day5-Comments-and-Print#main.py
Join Replit the browser-based IDE used in this course - https://join.replit.com/code-with-harry-100-doc
►Checkout my English channel here: https://www.youtube.com/channel/UC7btqG2Ww0_2LwuQxpvo2HQ
►Instagram: www.instagram.com/codewithharry

python, C, C++, Java, JavaScript and Other Cheetsheets [++]:
Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agrsRZjFECeFuWY5ev2pQlk

►Learn in One Video[++]:
Python[15 Hr]: https://www.youtube.com/watch?v=gfDE2a7MKjA&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python Advance[3.5 Hr]: https://www.youtube.com/watch?v=61a7UkDO50s&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[1 Hr]: https://www.youtube.com/watch?v=qHJjMvHLJdg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[2 Hr]: https://www.youtube.com/watch?v=ihk_Xglr164&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[15 Min]:https://www.youtube.com/watch?v=fr1f84rg4Nw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JavaScript[1 Hr]: https://www.youtube.com/watch?v=onbBV0uFVpo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
C[1.3 Hr]-https://www.youtube.com/watch?v=YXcgD8hRHYY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[1 Hr]: https://www.youtube.com/watch?v=xW7ro3lwaCI&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[2.3 Hr]:https://www.youtube.com/watch?v=1SnPKhCdlsU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[Project]- https://www.youtube.com/watch?v=-al2bECumKg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
HTML[30 Min]:https://www.youtube.com/watch?v=E3ByCRqE7Lo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[8.5 Hr]:https://www.youtube.com/watch?v=Edsxf_NBFrw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[1.4 Hr]:https://www.youtube.com/watch?v=u5-K_ua9sOw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Wordpress[3.2 Hr]:https://www.youtube.com/watch?v=GlLRYml8mCY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Angular[2 Hr]:https://www.youtube.com/watch?v=0LhBvp8qpro&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Java[2.3 Hr]:https://www.youtube.com/watch?v=rV_3Lewxx6o&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Web Scraping[1 Hr]:https://www.youtube.com/watch?v=uufDGjTuq34&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
MongoDB[2 Hr]:https://www.youtube.com/watch?v=oSIv-E60NiU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Numpy[1 Hr]:https://www.youtube.com/watch?v=Rbh1rieb3zc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Android Dev[12 Hr]- https://www.youtube.com/watch?v=mXjZQX3UzOs
Linux[1 Hr]:https://www.youtube.com/watch?v=_tCY-c-sPZc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JQuery[1.1 Hr]:https://www.youtube.com/watch?v=YFlx1C8XwR0&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Git and GitHub[1.1 Hr]:https://www.youtube.com/watch?v=gwWKnnCMQ5c&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7

►Complete course [playlist]:
React: https://www.youtube.com/playlist?list=PLu0W_9lII9agx66oZnT6IyhcMIbUMNMdt
Python-https://www.youtube.com/playlist?list=PLu0W_9lII9agICnT8t4iYVSZ3eykIAOME
OOP Python-https://www.youtube.com/playlist?list=PLu0W_9lII9ahfRrhFcoB-4lpp9YaBmdCP
Java:https://www.youtube.com/playlist?list=PLu0W_9lII9agS67Uits0UnJyrYiXhDS6q
JavaScript- https://www.youtube.com/playlist?list=PLu0W_9lII9ajyk081To1Cbt2eI5913SsL
PHP-https://www.youtube.com/playlist?list=PLu0W_9lII9aikXkRE0WxDt1vozo3hnmtR
C-https://www.youtube.com/playlist?list=PLu0W_9lII9aiXlHcLx-mDH1Qul38wD3aR
C++-https://www.youtube.com/playlist?list=PLu0W_9lII9agpFUAlPFe_VNSlXW5uE0YL
Git & GitHub-https://www.youtube.com/playlist?list=PLu0W_9lII9ahVQekD7ePHmnirTePXwIln
Android Dev- https://www.youtube.com/playlist?list=PLu0W_9lII9aiL0kysYlfSOUgY5rNlOhUd
Python GUI- https://www.youtube.com/playlist?list=PLu0W_9lII9ajLcqRcj4PoEihkukF_OTzA
Web Development- https://www.youtube.com/playlist?list=PLu0W_9lII9agiCUZYRsvtGTXdxkzPyItg
Python Django:https://www.youtube.com/playlist?list=PLu0W_9lII9ah7DDtYtflgwMwpT3xmjXY9
Projects Using HTML, CSS & Javascript- https://www.youtube.com/playlist?list=PLu0W_9lII9aiQiOwthuSvinxoflmhRxM3
Data Structure and Algo:https://www.youtube.com/playlist?list=PLu0W_9lII9ahIappRPN0MCAgtOu3lQjQi 

Follow Me On Social Media
►Website (created using Django Rest & Angular): https://www.codewithharry.com
►Facebook: https://www.facebook.com/CodeWithHarry
►Instagram: https://www.instagram.com/codewithharry/ 
Twitter: https://twitter.com/CodeWithHarry
Comment "#HarryBhai" if you read this 😉😉', '1122', 'cmm6gxh3g0007akrmcwd1jz2z', '4', NULL, 'https://i.ytimg.com/vi/qxPMmW93eDs/maxresdefault.jpg', 'Comments, Escape Sequences & Print Statement | Python Tutorial - Day #5', '2026-02-28T15:20:57.509Z', 'cmm0s6pyg0000i9evqafvt8x4', 'qxPMmW93eDs');
INSERT INTO public."Video" ("id", "createdAt", "description", "duration", "playlistId", "position", "scheduledAt", "thumbnail", "title", "updatedAt", "userId", "youtubeId") VALUES ('cmm6gxjvg000jakrm0docsztx', '2026-02-28T15:20:57.820Z', 'Python Udemy Course: https://goharry.in/python
Get this course at 90% Discount if you use this link

Python is one of the most demanded programming languages in the job market. Surprisingly, it is equally easy to learn and master  Python. This python tutorial for absolute beginners in Hindi series will focus on teaching you python concepts from the ground up. 
Access the Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agwh1XjRt242xIpHhPT2llg
Link to the Repl: https://replit.com/@codewithharry/06-Day6-Variables-and-Data-Types#main.py
Join Replit the browser-based IDE used in this course - https://join.replit.com/code-with-harry-100-doc
►Checkout my English channel here: https://www.youtube.com/channel/UC7btqG2Ww0_2LwuQxpvo2HQ
►Instagram: www.instagram.com/codewithharry

python, C, C++, Java, JavaScript and Other Cheetsheets [++]:
Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agrsRZjFECeFuWY5ev2pQlk

►Learn in One Video[++]:
Python[15 Hr]: https://www.youtube.com/watch?v=gfDE2a7MKjA&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python Advance[3.5 Hr]: https://www.youtube.com/watch?v=61a7UkDO50s&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[1 Hr]: https://www.youtube.com/watch?v=qHJjMvHLJdg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[2 Hr]: https://www.youtube.com/watch?v=ihk_Xglr164&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[15 Min]:https://www.youtube.com/watch?v=fr1f84rg4Nw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JavaScript[1 Hr]: https://www.youtube.com/watch?v=onbBV0uFVpo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
C[1.3 Hr]-https://www.youtube.com/watch?v=YXcgD8hRHYY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[1 Hr]: https://www.youtube.com/watch?v=xW7ro3lwaCI&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[2.3 Hr]:https://www.youtube.com/watch?v=1SnPKhCdlsU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[Project]- https://www.youtube.com/watch?v=-al2bECumKg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
HTML[30 Min]:https://www.youtube.com/watch?v=E3ByCRqE7Lo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[8.5 Hr]:https://www.youtube.com/watch?v=Edsxf_NBFrw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[1.4 Hr]:https://www.youtube.com/watch?v=u5-K_ua9sOw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Wordpress[3.2 Hr]:https://www.youtube.com/watch?v=GlLRYml8mCY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Angular[2 Hr]:https://www.youtube.com/watch?v=0LhBvp8qpro&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Java[2.3 Hr]:https://www.youtube.com/watch?v=rV_3Lewxx6o&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Web Scraping[1 Hr]:https://www.youtube.com/watch?v=uufDGjTuq34&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
MongoDB[2 Hr]:https://www.youtube.com/watch?v=oSIv-E60NiU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Numpy[1 Hr]:https://www.youtube.com/watch?v=Rbh1rieb3zc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Android Dev[12 Hr]- https://www.youtube.com/watch?v=mXjZQX3UzOs
Linux[1 Hr]:https://www.youtube.com/watch?v=_tCY-c-sPZc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JQuery[1.1 Hr]:https://www.youtube.com/watch?v=YFlx1C8XwR0&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Git and GitHub[1.1 Hr]:https://www.youtube.com/watch?v=gwWKnnCMQ5c&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7

►Complete course [playlist]:
React: https://www.youtube.com/playlist?list=PLu0W_9lII9agx66oZnT6IyhcMIbUMNMdt
Python-https://www.youtube.com/playlist?list=PLu0W_9lII9agICnT8t4iYVSZ3eykIAOME
OOP Python-https://www.youtube.com/playlist?list=PLu0W_9lII9ahfRrhFcoB-4lpp9YaBmdCP
Java:https://www.youtube.com/playlist?list=PLu0W_9lII9agS67Uits0UnJyrYiXhDS6q
JavaScript- https://www.youtube.com/playlist?list=PLu0W_9lII9ajyk081To1Cbt2eI5913SsL
PHP-https://www.youtube.com/playlist?list=PLu0W_9lII9aikXkRE0WxDt1vozo3hnmtR
C-https://www.youtube.com/playlist?list=PLu0W_9lII9aiXlHcLx-mDH1Qul38wD3aR
C++-https://www.youtube.com/playlist?list=PLu0W_9lII9agpFUAlPFe_VNSlXW5uE0YL
Git & GitHub-https://www.youtube.com/playlist?list=PLu0W_9lII9ahVQekD7ePHmnirTePXwIln
Android Dev- https://www.youtube.com/playlist?list=PLu0W_9lII9aiL0kysYlfSOUgY5rNlOhUd
Python GUI- https://www.youtube.com/playlist?list=PLu0W_9lII9ajLcqRcj4PoEihkukF_OTzA
Web Development- https://www.youtube.com/playlist?list=PLu0W_9lII9agiCUZYRsvtGTXdxkzPyItg
Python Django:https://www.youtube.com/playlist?list=PLu0W_9lII9ah7DDtYtflgwMwpT3xmjXY9
Projects Using HTML, CSS & Javascript- https://www.youtube.com/playlist?list=PLu0W_9lII9aiQiOwthuSvinxoflmhRxM3
Data Structure and Algo:https://www.youtube.com/playlist?list=PLu0W_9lII9ahIappRPN0MCAgtOu3lQjQi 

Follow Me On Social Media
►Website (created using Django Rest & Angular): https://www.codewithharry.com
►Facebook: https://www.facebook.com/CodeWithHarry
►Instagram: https://www.instagram.com/codewithharry/ 
Twitter: https://twitter.com/CodeWithHarry
Comment "#HarryBhai" if you read this 😉😉', '1005', 'cmm6gxh3g0007akrmcwd1jz2z', '5', NULL, 'https://i.ytimg.com/vi/ORCuz7s5cCY/maxresdefault.jpg', 'Variables and Data Types | Python Tutorial - Day #6', '2026-02-28T15:20:57.820Z', 'cmm0s6pyg0000i9evqafvt8x4', 'ORCuz7s5cCY');
INSERT INTO public."Video" ("id", "createdAt", "description", "duration", "playlistId", "position", "scheduledAt", "thumbnail", "title", "updatedAt", "userId", "youtubeId") VALUES ('cmm6gxkc1000lakrm678uupmt', '2026-02-28T15:20:58.417Z', 'Python Udemy Course: https://goharry.in/python
Get this course at 90% Discount if you use this link

Python is one of the most demanded programming languages in the job market. Surprisingly, it is equally easy to learn and master  Python. This python tutorial for absolute beginners in Hindi series will focus on teaching you python concepts from the ground up. 
Access the Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agwh1XjRt242xIpHhPT2llg
Link to the Repl: https://replit.com/@codewithharry/07-Day7-Exercise-1-Create-a-Calculator#main.py
Join Replit the browser-based IDE used in this course - https://join.replit.com/code-with-harry-100-doc
►Checkout my English channel here: https://www.youtube.com/channel/UC7btqG2Ww0_2LwuQxpvo2HQ
►Instagram: www.instagram.com/codewithharry

python, C, C++, Java, JavaScript and Other Cheetsheets [++]:
Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agrsRZjFECeFuWY5ev2pQlk

►Learn in One Video[++]:
Python[15 Hr]: https://www.youtube.com/watch?v=gfDE2a7MKjA&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python Advance[3.5 Hr]: https://www.youtube.com/watch?v=61a7UkDO50s&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[1 Hr]: https://www.youtube.com/watch?v=qHJjMvHLJdg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[2 Hr]: https://www.youtube.com/watch?v=ihk_Xglr164&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[15 Min]:https://www.youtube.com/watch?v=fr1f84rg4Nw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JavaScript[1 Hr]: https://www.youtube.com/watch?v=onbBV0uFVpo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
C[1.3 Hr]-https://www.youtube.com/watch?v=YXcgD8hRHYY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[1 Hr]: https://www.youtube.com/watch?v=xW7ro3lwaCI&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[2.3 Hr]:https://www.youtube.com/watch?v=1SnPKhCdlsU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[Project]- https://www.youtube.com/watch?v=-al2bECumKg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
HTML[30 Min]:https://www.youtube.com/watch?v=E3ByCRqE7Lo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[8.5 Hr]:https://www.youtube.com/watch?v=Edsxf_NBFrw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[1.4 Hr]:https://www.youtube.com/watch?v=u5-K_ua9sOw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Wordpress[3.2 Hr]:https://www.youtube.com/watch?v=GlLRYml8mCY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Angular[2 Hr]:https://www.youtube.com/watch?v=0LhBvp8qpro&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Java[2.3 Hr]:https://www.youtube.com/watch?v=rV_3Lewxx6o&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Web Scraping[1 Hr]:https://www.youtube.com/watch?v=uufDGjTuq34&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
MongoDB[2 Hr]:https://www.youtube.com/watch?v=oSIv-E60NiU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Numpy[1 Hr]:https://www.youtube.com/watch?v=Rbh1rieb3zc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Android Dev[12 Hr]- https://www.youtube.com/watch?v=mXjZQX3UzOs
Linux[1 Hr]:https://www.youtube.com/watch?v=_tCY-c-sPZc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JQuery[1.1 Hr]:https://www.youtube.com/watch?v=YFlx1C8XwR0&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Git and GitHub[1.1 Hr]:https://www.youtube.com/watch?v=gwWKnnCMQ5c&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7

►Complete course [playlist]:
React: https://www.youtube.com/playlist?list=PLu0W_9lII9agx66oZnT6IyhcMIbUMNMdt
Python-https://www.youtube.com/playlist?list=PLu0W_9lII9agICnT8t4iYVSZ3eykIAOME
OOP Python-https://www.youtube.com/playlist?list=PLu0W_9lII9ahfRrhFcoB-4lpp9YaBmdCP
Java:https://www.youtube.com/playlist?list=PLu0W_9lII9agS67Uits0UnJyrYiXhDS6q
JavaScript- https://www.youtube.com/playlist?list=PLu0W_9lII9ajyk081To1Cbt2eI5913SsL
PHP-https://www.youtube.com/playlist?list=PLu0W_9lII9aikXkRE0WxDt1vozo3hnmtR
C-https://www.youtube.com/playlist?list=PLu0W_9lII9aiXlHcLx-mDH1Qul38wD3aR
C++-https://www.youtube.com/playlist?list=PLu0W_9lII9agpFUAlPFe_VNSlXW5uE0YL
Git & GitHub-https://www.youtube.com/playlist?list=PLu0W_9lII9ahVQekD7ePHmnirTePXwIln
Android Dev- https://www.youtube.com/playlist?list=PLu0W_9lII9aiL0kysYlfSOUgY5rNlOhUd
Python GUI- https://www.youtube.com/playlist?list=PLu0W_9lII9ajLcqRcj4PoEihkukF_OTzA
Web Development- https://www.youtube.com/playlist?list=PLu0W_9lII9agiCUZYRsvtGTXdxkzPyItg
Python Django:https://www.youtube.com/playlist?list=PLu0W_9lII9ah7DDtYtflgwMwpT3xmjXY9
Projects Using HTML, CSS & Javascript- https://www.youtube.com/playlist?list=PLu0W_9lII9aiQiOwthuSvinxoflmhRxM3
Data Structure and Algo:https://www.youtube.com/playlist?list=PLu0W_9lII9ahIappRPN0MCAgtOu3lQjQi 

Follow Me On Social Media
►Website (created using Django Rest & Angular): https://www.codewithharry.com
►Facebook: https://www.facebook.com/CodeWithHarry
►Instagram: https://www.instagram.com/codewithharry/ 
Twitter: https://twitter.com/CodeWithHarry
Comment "#HarryBhai" if you read this 😉😉', '410', 'cmm6gxh3g0007akrmcwd1jz2z', '6', NULL, 'https://i.ytimg.com/vi/FLVqcxnJP_E/maxresdefault.jpg', 'Exercise 1: Calculator using Python | Python Tutorial - Day #7', '2026-02-28T15:20:58.417Z', 'cmm0s6pyg0000i9evqafvt8x4', 'FLVqcxnJP_E');
INSERT INTO public."Video" ("id", "createdAt", "description", "duration", "playlistId", "position", "scheduledAt", "thumbnail", "title", "updatedAt", "userId", "youtubeId") VALUES ('cmm6gxkkn000nakrm8l6gt7gq', '2026-02-28T15:20:58.728Z', 'Python Udemy Course: https://goharry.in/python
Get this course at 90% Discount if you use this link

Python is one of the most demanded programming languages in the job market. Surprisingly, it is equally easy to learn and master  Python. This python tutorial for absolute beginners in Hindi series will focus on teaching you python concepts from the ground up. 
Access the Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agwh1XjRt242xIpHhPT2llg
Link to the Repl: https://replit.com/@codewithharry/08-Day8-Exercise-1-Create-a-Calculator-Solution#main.py
Join Replit the browser-based IDE used in this course - https://join.replit.com/code-with-harry-100-doc
►Checkout my English channel here: https://www.youtube.com/channel/UC7btqG2Ww0_2LwuQxpvo2HQ
►Instagram: www.instagram.com/codewithharry

python, C, C++, Java, JavaScript and Other Cheetsheets [++]:
Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agrsRZjFECeFuWY5ev2pQlk

►Learn in One Video[++]:
Python[15 Hr]: https://www.youtube.com/watch?v=gfDE2a7MKjA&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python Advance[3.5 Hr]: https://www.youtube.com/watch?v=61a7UkDO50s&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[1 Hr]: https://www.youtube.com/watch?v=qHJjMvHLJdg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[2 Hr]: https://www.youtube.com/watch?v=ihk_Xglr164&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[15 Min]:https://www.youtube.com/watch?v=fr1f84rg4Nw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JavaScript[1 Hr]: https://www.youtube.com/watch?v=onbBV0uFVpo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
C[1.3 Hr]-https://www.youtube.com/watch?v=YXcgD8hRHYY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[1 Hr]: https://www.youtube.com/watch?v=xW7ro3lwaCI&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[2.3 Hr]:https://www.youtube.com/watch?v=1SnPKhCdlsU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[Project]- https://www.youtube.com/watch?v=-al2bECumKg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
HTML[30 Min]:https://www.youtube.com/watch?v=E3ByCRqE7Lo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[8.5 Hr]:https://www.youtube.com/watch?v=Edsxf_NBFrw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[1.4 Hr]:https://www.youtube.com/watch?v=u5-K_ua9sOw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Wordpress[3.2 Hr]:https://www.youtube.com/watch?v=GlLRYml8mCY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Angular[2 Hr]:https://www.youtube.com/watch?v=0LhBvp8qpro&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Java[2.3 Hr]:https://www.youtube.com/watch?v=rV_3Lewxx6o&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Web Scraping[1 Hr]:https://www.youtube.com/watch?v=uufDGjTuq34&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
MongoDB[2 Hr]:https://www.youtube.com/watch?v=oSIv-E60NiU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Numpy[1 Hr]:https://www.youtube.com/watch?v=Rbh1rieb3zc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Android Dev[12 Hr]- https://www.youtube.com/watch?v=mXjZQX3UzOs
Linux[1 Hr]:https://www.youtube.com/watch?v=_tCY-c-sPZc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JQuery[1.1 Hr]:https://www.youtube.com/watch?v=YFlx1C8XwR0&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Git and GitHub[1.1 Hr]:https://www.youtube.com/watch?v=gwWKnnCMQ5c&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7

►Complete course [playlist]:
React: https://www.youtube.com/playlist?list=PLu0W_9lII9agx66oZnT6IyhcMIbUMNMdt
Python-https://www.youtube.com/playlist?list=PLu0W_9lII9agICnT8t4iYVSZ3eykIAOME
OOP Python-https://www.youtube.com/playlist?list=PLu0W_9lII9ahfRrhFcoB-4lpp9YaBmdCP
Java:https://www.youtube.com/playlist?list=PLu0W_9lII9agS67Uits0UnJyrYiXhDS6q
JavaScript- https://www.youtube.com/playlist?list=PLu0W_9lII9ajyk081To1Cbt2eI5913SsL
PHP-https://www.youtube.com/playlist?list=PLu0W_9lII9aikXkRE0WxDt1vozo3hnmtR
C-https://www.youtube.com/playlist?list=PLu0W_9lII9aiXlHcLx-mDH1Qul38wD3aR
C++-https://www.youtube.com/playlist?list=PLu0W_9lII9agpFUAlPFe_VNSlXW5uE0YL
Git & GitHub-https://www.youtube.com/playlist?list=PLu0W_9lII9ahVQekD7ePHmnirTePXwIln
Android Dev- https://www.youtube.com/playlist?list=PLu0W_9lII9aiL0kysYlfSOUgY5rNlOhUd
Python GUI- https://www.youtube.com/playlist?list=PLu0W_9lII9ajLcqRcj4PoEihkukF_OTzA
Web Development- https://www.youtube.com/playlist?list=PLu0W_9lII9agiCUZYRsvtGTXdxkzPyItg
Python Django:https://www.youtube.com/playlist?list=PLu0W_9lII9ah7DDtYtflgwMwpT3xmjXY9
Projects Using HTML, CSS & Javascript- https://www.youtube.com/playlist?list=PLu0W_9lII9aiQiOwthuSvinxoflmhRxM3
Data Structure and Algo:https://www.youtube.com/playlist?list=PLu0W_9lII9ahIappRPN0MCAgtOu3lQjQi 

Follow Me On Social Media
►Website (created using Django Rest & Angular): https://www.codewithharry.com
►Facebook: https://www.facebook.com/CodeWithHarry
►Instagram: https://www.instagram.com/codewithharry/ 
Twitter: https://twitter.com/CodeWithHarry
Comment "#HarryBhai" if you read this 😉😉', '622', 'cmm6gxh3g0007akrmcwd1jz2z', '7', NULL, 'https://i.ytimg.com/vi/dohaSBCKCr0/maxresdefault.jpg', 'Exercise 1: Calculator using Python (Solution) | Python Tutorial - Day #8', '2026-02-28T15:20:58.728Z', 'cmm0s6pyg0000i9evqafvt8x4', 'dohaSBCKCr0');
INSERT INTO public."Video" ("id", "createdAt", "description", "duration", "playlistId", "position", "scheduledAt", "thumbnail", "title", "updatedAt", "userId", "youtubeId") VALUES ('cmm6gxl01000pakrm043r6o63', '2026-02-28T15:20:59.281Z', 'Python Udemy Course: https://goharry.in/python
Get this course at 90% Discount if you use this link

Python is one of the most demanded programming languages in the job market. Surprisingly, it is equally easy to learn and master  Python. This python tutorial for absolute beginners in Hindi series will focus on teaching you python concepts from the ground up. 
Access the Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agwh1XjRt242xIpHhPT2llg
Link to the Repl: https://replit.com/@codewithharry/09-Day9-Typecasting-in-Python
Join Replit the browser-based IDE used in this course - https://join.replit.com/code-with-harry-100-doc
►Checkout my English channel here: https://www.youtube.com/channel/UC7btqG2Ww0_2LwuQxpvo2HQ
►Instagram: www.instagram.com/codewithharry

python, C, C++, Java, JavaScript and Other Cheetsheets [++]:
Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agrsRZjFECeFuWY5ev2pQlk

►Learn in One Video[++]:
Python[15 Hr]: https://www.youtube.com/watch?v=gfDE2a7MKjA&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python Advance[3.5 Hr]: https://www.youtube.com/watch?v=61a7UkDO50s&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[1 Hr]: https://www.youtube.com/watch?v=qHJjMvHLJdg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[2 Hr]: https://www.youtube.com/watch?v=ihk_Xglr164&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[15 Min]:https://www.youtube.com/watch?v=fr1f84rg4Nw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JavaScript[1 Hr]: https://www.youtube.com/watch?v=onbBV0uFVpo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
C[1.3 Hr]-https://www.youtube.com/watch?v=YXcgD8hRHYY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[1 Hr]: https://www.youtube.com/watch?v=xW7ro3lwaCI&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[2.3 Hr]:https://www.youtube.com/watch?v=1SnPKhCdlsU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[Project]- https://www.youtube.com/watch?v=-al2bECumKg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
HTML[30 Min]:https://www.youtube.com/watch?v=E3ByCRqE7Lo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[8.5 Hr]:https://www.youtube.com/watch?v=Edsxf_NBFrw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[1.4 Hr]:https://www.youtube.com/watch?v=u5-K_ua9sOw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Wordpress[3.2 Hr]:https://www.youtube.com/watch?v=GlLRYml8mCY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Angular[2 Hr]:https://www.youtube.com/watch?v=0LhBvp8qpro&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Java[2.3 Hr]:https://www.youtube.com/watch?v=rV_3Lewxx6o&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Web Scraping[1 Hr]:https://www.youtube.com/watch?v=uufDGjTuq34&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
MongoDB[2 Hr]:https://www.youtube.com/watch?v=oSIv-E60NiU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Numpy[1 Hr]:https://www.youtube.com/watch?v=Rbh1rieb3zc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Android Dev[12 Hr]- https://www.youtube.com/watch?v=mXjZQX3UzOs
Linux[1 Hr]:https://www.youtube.com/watch?v=_tCY-c-sPZc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JQuery[1.1 Hr]:https://www.youtube.com/watch?v=YFlx1C8XwR0&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Git and GitHub[1.1 Hr]:https://www.youtube.com/watch?v=gwWKnnCMQ5c&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7

►Complete course [playlist]:
React: https://www.youtube.com/playlist?list=PLu0W_9lII9agx66oZnT6IyhcMIbUMNMdt
Python-https://www.youtube.com/playlist?list=PLu0W_9lII9agICnT8t4iYVSZ3eykIAOME
OOP Python-https://www.youtube.com/playlist?list=PLu0W_9lII9ahfRrhFcoB-4lpp9YaBmdCP
Java:https://www.youtube.com/playlist?list=PLu0W_9lII9agS67Uits0UnJyrYiXhDS6q
JavaScript- https://www.youtube.com/playlist?list=PLu0W_9lII9ajyk081To1Cbt2eI5913SsL
PHP-https://www.youtube.com/playlist?list=PLu0W_9lII9aikXkRE0WxDt1vozo3hnmtR
C-https://www.youtube.com/playlist?list=PLu0W_9lII9aiXlHcLx-mDH1Qul38wD3aR
C++-https://www.youtube.com/playlist?list=PLu0W_9lII9agpFUAlPFe_VNSlXW5uE0YL
Git & GitHub-https://www.youtube.com/playlist?list=PLu0W_9lII9ahVQekD7ePHmnirTePXwIln
Android Dev- https://www.youtube.com/playlist?list=PLu0W_9lII9aiL0kysYlfSOUgY5rNlOhUd
Python GUI- https://www.youtube.com/playlist?list=PLu0W_9lII9ajLcqRcj4PoEihkukF_OTzA
Web Development- https://www.youtube.com/playlist?list=PLu0W_9lII9agiCUZYRsvtGTXdxkzPyItg
Python Django:https://www.youtube.com/playlist?list=PLu0W_9lII9ah7DDtYtflgwMwpT3xmjXY9
Projects Using HTML, CSS & Javascript- https://www.youtube.com/playlist?list=PLu0W_9lII9aiQiOwthuSvinxoflmhRxM3
Data Structure and Algo:https://www.youtube.com/playlist?list=PLu0W_9lII9ahIappRPN0MCAgtOu3lQjQi 

Follow Me On Social Media
►Website (created using Django Rest & Angular): https://www.codewithharry.com
►Facebook: https://www.facebook.com/CodeWithHarry
►Instagram: https://www.instagram.com/codewithharry/ 
Twitter: https://twitter.com/CodeWithHarry
Comment "#HarryBhai" if you read this 😉😉', '565', 'cmm6gxh3g0007akrmcwd1jz2z', '8', NULL, 'https://i.ytimg.com/vi/Pu5bqySSSS0/maxresdefault.jpg', 'Typecasting in Python | Python Tutorial - Day #9', '2026-02-28T15:20:59.281Z', 'cmm0s6pyg0000i9evqafvt8x4', 'Pu5bqySSSS0');
INSERT INTO public."Video" ("id", "createdAt", "description", "duration", "playlistId", "position", "scheduledAt", "thumbnail", "title", "updatedAt", "userId", "youtubeId") VALUES ('cmm6gxlfa000rakrmnshhptgg', '2026-02-28T15:20:59.830Z', 'Python Udemy Course: https://goharry.in/python
Get this course at 90% Discount if you use this link

Python is one of the most demanded programming languages in the job market. Surprisingly, it is equally easy to learn and master  Python. This python tutorial for absolute beginners in Hindi series will focus on teaching you python concepts from the ground up. 
Access the Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agwh1XjRt242xIpHhPT2llg
Link to the Repl: https://replit.com/@codewithharry/10-Day10-Taking-User-Input#main.py
Join Replit the browser-based IDE used in this course - https://join.replit.com/code-with-harry-100-doc
►Checkout my English channel here: https://www.youtube.com/channel/UC7btqG2Ww0_2LwuQxpvo2HQ
►Instagram: www.instagram.com/codewithharry

python, C, C++, Java, JavaScript and Other Cheetsheets [++]:
Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agrsRZjFECeFuWY5ev2pQlk

►Learn in One Video[++]:
Python[15 Hr]: https://www.youtube.com/watch?v=gfDE2a7MKjA&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python Advance[3.5 Hr]: https://www.youtube.com/watch?v=61a7UkDO50s&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[1 Hr]: https://www.youtube.com/watch?v=qHJjMvHLJdg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[2 Hr]: https://www.youtube.com/watch?v=ihk_Xglr164&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[15 Min]:https://www.youtube.com/watch?v=fr1f84rg4Nw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JavaScript[1 Hr]: https://www.youtube.com/watch?v=onbBV0uFVpo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
C[1.3 Hr]-https://www.youtube.com/watch?v=YXcgD8hRHYY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[1 Hr]: https://www.youtube.com/watch?v=xW7ro3lwaCI&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[2.3 Hr]:https://www.youtube.com/watch?v=1SnPKhCdlsU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[Project]- https://www.youtube.com/watch?v=-al2bECumKg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
HTML[30 Min]:https://www.youtube.com/watch?v=E3ByCRqE7Lo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[8.5 Hr]:https://www.youtube.com/watch?v=Edsxf_NBFrw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[1.4 Hr]:https://www.youtube.com/watch?v=u5-K_ua9sOw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Wordpress[3.2 Hr]:https://www.youtube.com/watch?v=GlLRYml8mCY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Angular[2 Hr]:https://www.youtube.com/watch?v=0LhBvp8qpro&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Java[2.3 Hr]:https://www.youtube.com/watch?v=rV_3Lewxx6o&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Web Scraping[1 Hr]:https://www.youtube.com/watch?v=uufDGjTuq34&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
MongoDB[2 Hr]:https://www.youtube.com/watch?v=oSIv-E60NiU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Numpy[1 Hr]:https://www.youtube.com/watch?v=Rbh1rieb3zc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Android Dev[12 Hr]- https://www.youtube.com/watch?v=mXjZQX3UzOs
Linux[1 Hr]:https://www.youtube.com/watch?v=_tCY-c-sPZc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JQuery[1.1 Hr]:https://www.youtube.com/watch?v=YFlx1C8XwR0&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Git and GitHub[1.1 Hr]:https://www.youtube.com/watch?v=gwWKnnCMQ5c&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7

►Complete course [playlist]:
React: https://www.youtube.com/playlist?list=PLu0W_9lII9agx66oZnT6IyhcMIbUMNMdt
Python-https://www.youtube.com/playlist?list=PLu0W_9lII9agICnT8t4iYVSZ3eykIAOME
OOP Python-https://www.youtube.com/playlist?list=PLu0W_9lII9ahfRrhFcoB-4lpp9YaBmdCP
Java:https://www.youtube.com/playlist?list=PLu0W_9lII9agS67Uits0UnJyrYiXhDS6q
JavaScript- https://www.youtube.com/playlist?list=PLu0W_9lII9ajyk081To1Cbt2eI5913SsL
PHP-https://www.youtube.com/playlist?list=PLu0W_9lII9aikXkRE0WxDt1vozo3hnmtR
C-https://www.youtube.com/playlist?list=PLu0W_9lII9aiXlHcLx-mDH1Qul38wD3aR
C++-https://www.youtube.com/playlist?list=PLu0W_9lII9agpFUAlPFe_VNSlXW5uE0YL
Git & GitHub-https://www.youtube.com/playlist?list=PLu0W_9lII9ahVQekD7ePHmnirTePXwIln
Android Dev- https://www.youtube.com/playlist?list=PLu0W_9lII9aiL0kysYlfSOUgY5rNlOhUd
Python GUI- https://www.youtube.com/playlist?list=PLu0W_9lII9ajLcqRcj4PoEihkukF_OTzA
Web Development- https://www.youtube.com/playlist?list=PLu0W_9lII9agiCUZYRsvtGTXdxkzPyItg
Python Django:https://www.youtube.com/playlist?list=PLu0W_9lII9ah7DDtYtflgwMwpT3xmjXY9
Projects Using HTML, CSS & Javascript- https://www.youtube.com/playlist?list=PLu0W_9lII9aiQiOwthuSvinxoflmhRxM3
Data Structure and Algo:https://www.youtube.com/playlist?list=PLu0W_9lII9ahIappRPN0MCAgtOu3lQjQi 

Follow Me On Social Media
►Website (created using Django Rest & Angular): https://www.codewithharry.com
►Facebook: https://www.facebook.com/CodeWithHarry
►Instagram: https://www.instagram.com/codewithharry/ 
Twitter: https://twitter.com/CodeWithHarry
Comment "#HarryBhai" if you read this 😉😉', '616', 'cmm6gxh3g0007akrmcwd1jz2z', '9', NULL, 'https://i.ytimg.com/vi/WvG-R-xXouA/maxresdefault.jpg', 'Taking User Input in Python | Python Tutorial - Day #10', '2026-02-28T15:20:59.830Z', 'cmm0s6pyg0000i9evqafvt8x4', 'WvG-R-xXouA');
INSERT INTO public."Video" ("id", "createdAt", "description", "duration", "playlistId", "position", "scheduledAt", "thumbnail", "title", "updatedAt", "userId", "youtubeId") VALUES ('cmm6gxlud000takrmtwyl6gpz', '2026-02-28T15:21:00.374Z', 'Python is one of the most demanded programming languages in the job market. Surprisingly, it is equally easy to learn and master  Python. This python tutorial for absolute beginners in Hindi series will focus on teaching you python concepts from the ground up. 
Access the Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agwh1XjRt242xIpHhPT2llg
Link to the Repl: https://replit.com/@codewithharry/11-Day11-Strings#main.py
Join Replit the browser-based IDE used in this course - https://join.replit.com/code-with-harry-100-doc
►Checkout my English channel here: https://www.youtube.com/channel/UC7btqG2Ww0_2LwuQxpvo2HQ
►Instagram: www.instagram.com/codewithharry

python, C, C++, Java, JavaScript and Other Cheetsheets [++]:
Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agrsRZjFECeFuWY5ev2pQlk

►Learn in One Video[++]:
Python[15 Hr]: https://www.youtube.com/watch?v=gfDE2a7MKjA&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python Advance[3.5 Hr]: https://www.youtube.com/watch?v=61a7UkDO50s&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[1 Hr]: https://www.youtube.com/watch?v=qHJjMvHLJdg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[2 Hr]: https://www.youtube.com/watch?v=ihk_Xglr164&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[15 Min]:https://www.youtube.com/watch?v=fr1f84rg4Nw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JavaScript[1 Hr]: https://www.youtube.com/watch?v=onbBV0uFVpo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
C[1.3 Hr]-https://www.youtube.com/watch?v=YXcgD8hRHYY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[1 Hr]: https://www.youtube.com/watch?v=xW7ro3lwaCI&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[2.3 Hr]:https://www.youtube.com/watch?v=1SnPKhCdlsU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[Project]- https://www.youtube.com/watch?v=-al2bECumKg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
HTML[30 Min]:https://www.youtube.com/watch?v=E3ByCRqE7Lo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[8.5 Hr]:https://www.youtube.com/watch?v=Edsxf_NBFrw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[1.4 Hr]:https://www.youtube.com/watch?v=u5-K_ua9sOw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Wordpress[3.2 Hr]:https://www.youtube.com/watch?v=GlLRYml8mCY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Angular[2 Hr]:https://www.youtube.com/watch?v=0LhBvp8qpro&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Java[2.3 Hr]:https://www.youtube.com/watch?v=rV_3Lewxx6o&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Web Scraping[1 Hr]:https://www.youtube.com/watch?v=uufDGjTuq34&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
MongoDB[2 Hr]:https://www.youtube.com/watch?v=oSIv-E60NiU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Numpy[1 Hr]:https://www.youtube.com/watch?v=Rbh1rieb3zc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Android Dev[12 Hr]- https://www.youtube.com/watch?v=mXjZQX3UzOs
Linux[1 Hr]:https://www.youtube.com/watch?v=_tCY-c-sPZc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JQuery[1.1 Hr]:https://www.youtube.com/watch?v=YFlx1C8XwR0&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Git and GitHub[1.1 Hr]:https://www.youtube.com/watch?v=gwWKnnCMQ5c&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7

►Complete course [playlist]:
React: https://www.youtube.com/playlist?list=PLu0W_9lII9agx66oZnT6IyhcMIbUMNMdt
Python-https://www.youtube.com/playlist?list=PLu0W_9lII9agICnT8t4iYVSZ3eykIAOME
OOP Python-https://www.youtube.com/playlist?list=PLu0W_9lII9ahfRrhFcoB-4lpp9YaBmdCP
Java:https://www.youtube.com/playlist?list=PLu0W_9lII9agS67Uits0UnJyrYiXhDS6q
JavaScript- https://www.youtube.com/playlist?list=PLu0W_9lII9ajyk081To1Cbt2eI5913SsL
PHP-https://www.youtube.com/playlist?list=PLu0W_9lII9aikXkRE0WxDt1vozo3hnmtR
C-https://www.youtube.com/playlist?list=PLu0W_9lII9aiXlHcLx-mDH1Qul38wD3aR
C++-https://www.youtube.com/playlist?list=PLu0W_9lII9agpFUAlPFe_VNSlXW5uE0YL
Git & GitHub-https://www.youtube.com/playlist?list=PLu0W_9lII9ahVQekD7ePHmnirTePXwIln
Android Dev- https://www.youtube.com/playlist?list=PLu0W_9lII9aiL0kysYlfSOUgY5rNlOhUd
Python GUI- https://www.youtube.com/playlist?list=PLu0W_9lII9ajLcqRcj4PoEihkukF_OTzA
Web Development- https://www.youtube.com/playlist?list=PLu0W_9lII9agiCUZYRsvtGTXdxkzPyItg
Python Django:https://www.youtube.com/playlist?list=PLu0W_9lII9ah7DDtYtflgwMwpT3xmjXY9
Projects Using HTML, CSS & Javascript- https://www.youtube.com/playlist?list=PLu0W_9lII9aiQiOwthuSvinxoflmhRxM3
Data Structure and Algo:https://www.youtube.com/playlist?list=PLu0W_9lII9ahIappRPN0MCAgtOu3lQjQi 

Follow Me On Social Media
►Website (created using Django Rest & Angular): https://www.codewithharry.com
►Facebook: https://www.facebook.com/CodeWithHarry
►Instagram: https://www.instagram.com/codewithharry/ 
Twitter: https://twitter.com/CodeWithHarry
Comment "#HarryBhai" if you read this 😉😉', '695', 'cmm6gxh3g0007akrmcwd1jz2z', '10', NULL, 'https://i.ytimg.com/vi/kMNFQYArrLg/maxresdefault.jpg', 'Strings in Python | Python Tutorial - Day #11', '2026-02-28T15:21:00.374Z', 'cmm0s6pyg0000i9evqafvt8x4', 'kMNFQYArrLg');
INSERT INTO public."Video" ("id", "createdAt", "description", "duration", "playlistId", "position", "scheduledAt", "thumbnail", "title", "updatedAt", "userId", "youtubeId") VALUES ('cmm6gxm9i000vakrmbrw8z7vq', '2026-02-28T15:21:00.918Z', 'Python is one of the most demanded programming languages in the job market. Surprisingly, it is equally easy to learn and master  Python. This python tutorial for absolute beginners in Hindi series will focus on teaching you python concepts from the ground up. 
Access the Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agwh1XjRt242xIpHhPT2llg
Link to the Repl: https://replit.com/@codewithharry/12-Day12-Strings-Slicing#main.py
Join Replit the browser-based IDE used in this course - https://join.replit.com/code-with-harry-100-doc
►Checkout my English channel here: https://www.youtube.com/channel/UC7btqG2Ww0_2LwuQxpvo2HQ
►Instagram: www.instagram.com/codewithharry

python, C, C++, Java, JavaScript and Other Cheetsheets [++]:
Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agrsRZjFECeFuWY5ev2pQlk

►Learn in One Video[++]:
Python[15 Hr]: https://www.youtube.com/watch?v=gfDE2a7MKjA&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python Advance[3.5 Hr]: https://www.youtube.com/watch?v=61a7UkDO50s&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[1 Hr]: https://www.youtube.com/watch?v=qHJjMvHLJdg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[2 Hr]: https://www.youtube.com/watch?v=ihk_Xglr164&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[15 Min]:https://www.youtube.com/watch?v=fr1f84rg4Nw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JavaScript[1 Hr]: https://www.youtube.com/watch?v=onbBV0uFVpo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
C[1.3 Hr]-https://www.youtube.com/watch?v=YXcgD8hRHYY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[1 Hr]: https://www.youtube.com/watch?v=xW7ro3lwaCI&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[2.3 Hr]:https://www.youtube.com/watch?v=1SnPKhCdlsU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[Project]- https://www.youtube.com/watch?v=-al2bECumKg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
HTML[30 Min]:https://www.youtube.com/watch?v=E3ByCRqE7Lo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[8.5 Hr]:https://www.youtube.com/watch?v=Edsxf_NBFrw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[1.4 Hr]:https://www.youtube.com/watch?v=u5-K_ua9sOw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Wordpress[3.2 Hr]:https://www.youtube.com/watch?v=GlLRYml8mCY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Angular[2 Hr]:https://www.youtube.com/watch?v=0LhBvp8qpro&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Java[2.3 Hr]:https://www.youtube.com/watch?v=rV_3Lewxx6o&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Web Scraping[1 Hr]:https://www.youtube.com/watch?v=uufDGjTuq34&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
MongoDB[2 Hr]:https://www.youtube.com/watch?v=oSIv-E60NiU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Numpy[1 Hr]:https://www.youtube.com/watch?v=Rbh1rieb3zc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Android Dev[12 Hr]- https://www.youtube.com/watch?v=mXjZQX3UzOs
Linux[1 Hr]:https://www.youtube.com/watch?v=_tCY-c-sPZc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JQuery[1.1 Hr]:https://www.youtube.com/watch?v=YFlx1C8XwR0&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Git and GitHub[1.1 Hr]:https://www.youtube.com/watch?v=gwWKnnCMQ5c&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7

►Complete course [playlist]:
React: https://www.youtube.com/playlist?list=PLu0W_9lII9agx66oZnT6IyhcMIbUMNMdt
Python-https://www.youtube.com/playlist?list=PLu0W_9lII9agICnT8t4iYVSZ3eykIAOME
OOP Python-https://www.youtube.com/playlist?list=PLu0W_9lII9ahfRrhFcoB-4lpp9YaBmdCP
Java:https://www.youtube.com/playlist?list=PLu0W_9lII9agS67Uits0UnJyrYiXhDS6q
JavaScript- https://www.youtube.com/playlist?list=PLu0W_9lII9ajyk081To1Cbt2eI5913SsL
PHP-https://www.youtube.com/playlist?list=PLu0W_9lII9aikXkRE0WxDt1vozo3hnmtR
C-https://www.youtube.com/playlist?list=PLu0W_9lII9aiXlHcLx-mDH1Qul38wD3aR
C++-https://www.youtube.com/playlist?list=PLu0W_9lII9agpFUAlPFe_VNSlXW5uE0YL
Git & GitHub-https://www.youtube.com/playlist?list=PLu0W_9lII9ahVQekD7ePHmnirTePXwIln
Android Dev- https://www.youtube.com/playlist?list=PLu0W_9lII9aiL0kysYlfSOUgY5rNlOhUd
Python GUI- https://www.youtube.com/playlist?list=PLu0W_9lII9ajLcqRcj4PoEihkukF_OTzA
Web Development- https://www.youtube.com/playlist?list=PLu0W_9lII9agiCUZYRsvtGTXdxkzPyItg
Python Django:https://www.youtube.com/playlist?list=PLu0W_9lII9ah7DDtYtflgwMwpT3xmjXY9
Projects Using HTML, CSS & Javascript- https://www.youtube.com/playlist?list=PLu0W_9lII9aiQiOwthuSvinxoflmhRxM3
Data Structure and Algo:https://www.youtube.com/playlist?list=PLu0W_9lII9ahIappRPN0MCAgtOu3lQjQi 

Follow Me On Social Media
►Website (created using Django Rest & Angular): https://www.codewithharry.com
►Facebook: https://www.facebook.com/CodeWithHarry
►Instagram: https://www.instagram.com/codewithharry/ 
Twitter: https://twitter.com/CodeWithHarry
Comment "#HarryBhai" if you read this 😉😉', '708', 'cmm6gxh3g0007akrmcwd1jz2z', '11', NULL, 'https://i.ytimg.com/vi/8jW7lpT8HW8/maxresdefault.jpg', 'Strings Slicing and Operations on Strings in Python | Python Tutorial - Day #12', '2026-02-28T15:21:00.918Z', 'cmm0s6pyg0000i9evqafvt8x4', '8jW7lpT8HW8');
INSERT INTO public."Video" ("id", "createdAt", "description", "duration", "playlistId", "position", "scheduledAt", "thumbnail", "title", "updatedAt", "userId", "youtubeId") VALUES ('cmm6gxmoo000xakrmi412k2fx', '2026-02-28T15:21:01.464Z', 'Python is one of the most demanded programming languages in the job market. Surprisingly, it is equally easy to learn and master  Python. This python tutorial for absolute beginners in Hindi series will focus on teaching you python concepts from the ground up. 
Access the Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agwh1XjRt242xIpHhPT2llg
Link to the Repl: https://replit.com/@codewithharry/13-Day13-String-Methods#main.py
Join Replit the browser-based IDE used in this course - https://join.replit.com/code-with-harry-100-doc
►Checkout my English channel here: https://www.youtube.com/channel/UC7btqG2Ww0_2LwuQxpvo2HQ
►Instagram: www.instagram.com/codewithharry

python, C, C++, Java, JavaScript and Other Cheetsheets [++]:
Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agrsRZjFECeFuWY5ev2pQlk

►Learn in One Video[++]:
Python[15 Hr]: https://www.youtube.com/watch?v=gfDE2a7MKjA&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python Advance[3.5 Hr]: https://www.youtube.com/watch?v=61a7UkDO50s&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[1 Hr]: https://www.youtube.com/watch?v=qHJjMvHLJdg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[2 Hr]: https://www.youtube.com/watch?v=ihk_Xglr164&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[15 Min]:https://www.youtube.com/watch?v=fr1f84rg4Nw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JavaScript[1 Hr]: https://www.youtube.com/watch?v=onbBV0uFVpo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
C[1.3 Hr]-https://www.youtube.com/watch?v=YXcgD8hRHYY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[1 Hr]: https://www.youtube.com/watch?v=xW7ro3lwaCI&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[2.3 Hr]:https://www.youtube.com/watch?v=1SnPKhCdlsU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[Project]- https://www.youtube.com/watch?v=-al2bECumKg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
HTML[30 Min]:https://www.youtube.com/watch?v=E3ByCRqE7Lo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[8.5 Hr]:https://www.youtube.com/watch?v=Edsxf_NBFrw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[1.4 Hr]:https://www.youtube.com/watch?v=u5-K_ua9sOw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Wordpress[3.2 Hr]:https://www.youtube.com/watch?v=GlLRYml8mCY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Angular[2 Hr]:https://www.youtube.com/watch?v=0LhBvp8qpro&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Java[2.3 Hr]:https://www.youtube.com/watch?v=rV_3Lewxx6o&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Web Scraping[1 Hr]:https://www.youtube.com/watch?v=uufDGjTuq34&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
MongoDB[2 Hr]:https://www.youtube.com/watch?v=oSIv-E60NiU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Numpy[1 Hr]:https://www.youtube.com/watch?v=Rbh1rieb3zc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Android Dev[12 Hr]- https://www.youtube.com/watch?v=mXjZQX3UzOs
Linux[1 Hr]:https://www.youtube.com/watch?v=_tCY-c-sPZc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JQuery[1.1 Hr]:https://www.youtube.com/watch?v=YFlx1C8XwR0&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Git and GitHub[1.1 Hr]:https://www.youtube.com/watch?v=gwWKnnCMQ5c&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7

►Complete course [playlist]:
React: https://www.youtube.com/playlist?list=PLu0W_9lII9agx66oZnT6IyhcMIbUMNMdt
Python-https://www.youtube.com/playlist?list=PLu0W_9lII9agICnT8t4iYVSZ3eykIAOME
OOP Python-https://www.youtube.com/playlist?list=PLu0W_9lII9ahfRrhFcoB-4lpp9YaBmdCP
Java:https://www.youtube.com/playlist?list=PLu0W_9lII9agS67Uits0UnJyrYiXhDS6q
JavaScript- https://www.youtube.com/playlist?list=PLu0W_9lII9ajyk081To1Cbt2eI5913SsL
PHP-https://www.youtube.com/playlist?list=PLu0W_9lII9aikXkRE0WxDt1vozo3hnmtR
C-https://www.youtube.com/playlist?list=PLu0W_9lII9aiXlHcLx-mDH1Qul38wD3aR
C++-https://www.youtube.com/playlist?list=PLu0W_9lII9agpFUAlPFe_VNSlXW5uE0YL
Git & GitHub-https://www.youtube.com/playlist?list=PLu0W_9lII9ahVQekD7ePHmnirTePXwIln
Android Dev- https://www.youtube.com/playlist?list=PLu0W_9lII9aiL0kysYlfSOUgY5rNlOhUd
Python GUI- https://www.youtube.com/playlist?list=PLu0W_9lII9ajLcqRcj4PoEihkukF_OTzA
Web Development- https://www.youtube.com/playlist?list=PLu0W_9lII9agiCUZYRsvtGTXdxkzPyItg
Python Django:https://www.youtube.com/playlist?list=PLu0W_9lII9ah7DDtYtflgwMwpT3xmjXY9
Projects Using HTML, CSS & Javascript- https://www.youtube.com/playlist?list=PLu0W_9lII9aiQiOwthuSvinxoflmhRxM3
Data Structure and Algo:https://www.youtube.com/playlist?list=PLu0W_9lII9ahIappRPN0MCAgtOu3lQjQi 

Follow Me On Social Media
►Website (created using Django Rest & Angular): https://www.codewithharry.com
►Facebook: https://www.facebook.com/CodeWithHarry
►Instagram: https://www.instagram.com/codewithharry/ 
Twitter: https://twitter.com/CodeWithHarry
Comment "#HarryBhai" if you read this 😉😉', '1352', 'cmm6gxh3g0007akrmcwd1jz2z', '12', NULL, 'https://i.ytimg.com/vi/0INvoK_T0cE/maxresdefault.jpg', 'String Methods in Python | Python Tutorial - Day #13', '2026-02-28T15:21:01.464Z', 'cmm0s6pyg0000i9evqafvt8x4', '0INvoK_T0cE');
INSERT INTO public."Video" ("id", "createdAt", "description", "duration", "playlistId", "position", "scheduledAt", "thumbnail", "title", "updatedAt", "userId", "youtubeId") VALUES ('cmm6gxn3p000zakrm8yz6oakm', '2026-02-28T15:21:02.005Z', 'Python is one of the most demanded programming languages in the job market. Surprisingly, it is equally easy to learn and master  Python. This python tutorial for absolute beginners in Hindi series will focus on teaching you python concepts from the ground up. 
Access the Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agwh1XjRt242xIpHhPT2llg
Link to the Repl: https://replit.com/@codewithharry/14-Day14-If-Else-Conditionals
Join Replit the browser-based IDE used in this course - https://join.replit.com/code-with-harry-100-doc
►Checkout my English channel here: https://www.youtube.com/channel/UC7btqG2Ww0_2LwuQxpvo2HQ
►Instagram: www.instagram.com/codewithharry

python, C, C++, Java, JavaScript and Other Cheetsheets [++]:
Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agrsRZjFECeFuWY5ev2pQlk

►Learn in One Video[++]:
Python[15 Hr]: https://www.youtube.com/watch?v=gfDE2a7MKjA&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python Advance[3.5 Hr]: https://www.youtube.com/watch?v=61a7UkDO50s&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[1 Hr]: https://www.youtube.com/watch?v=qHJjMvHLJdg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[2 Hr]: https://www.youtube.com/watch?v=ihk_Xglr164&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[15 Min]:https://www.youtube.com/watch?v=fr1f84rg4Nw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JavaScript[1 Hr]: https://www.youtube.com/watch?v=onbBV0uFVpo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
C[1.3 Hr]-https://www.youtube.com/watch?v=YXcgD8hRHYY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[1 Hr]: https://www.youtube.com/watch?v=xW7ro3lwaCI&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[2.3 Hr]:https://www.youtube.com/watch?v=1SnPKhCdlsU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[Project]- https://www.youtube.com/watch?v=-al2bECumKg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
HTML[30 Min]:https://www.youtube.com/watch?v=E3ByCRqE7Lo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[8.5 Hr]:https://www.youtube.com/watch?v=Edsxf_NBFrw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[1.4 Hr]:https://www.youtube.com/watch?v=u5-K_ua9sOw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Wordpress[3.2 Hr]:https://www.youtube.com/watch?v=GlLRYml8mCY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Angular[2 Hr]:https://www.youtube.com/watch?v=0LhBvp8qpro&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Java[2.3 Hr]:https://www.youtube.com/watch?v=rV_3Lewxx6o&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Web Scraping[1 Hr]:https://www.youtube.com/watch?v=uufDGjTuq34&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
MongoDB[2 Hr]:https://www.youtube.com/watch?v=oSIv-E60NiU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Numpy[1 Hr]:https://www.youtube.com/watch?v=Rbh1rieb3zc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Android Dev[12 Hr]- https://www.youtube.com/watch?v=mXjZQX3UzOs
Linux[1 Hr]:https://www.youtube.com/watch?v=_tCY-c-sPZc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JQuery[1.1 Hr]:https://www.youtube.com/watch?v=YFlx1C8XwR0&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Git and GitHub[1.1 Hr]:https://www.youtube.com/watch?v=gwWKnnCMQ5c&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7

►Complete course [playlist]:
React: https://www.youtube.com/playlist?list=PLu0W_9lII9agx66oZnT6IyhcMIbUMNMdt
Python-https://www.youtube.com/playlist?list=PLu0W_9lII9agICnT8t4iYVSZ3eykIAOME
OOP Python-https://www.youtube.com/playlist?list=PLu0W_9lII9ahfRrhFcoB-4lpp9YaBmdCP
Java:https://www.youtube.com/playlist?list=PLu0W_9lII9agS67Uits0UnJyrYiXhDS6q
JavaScript- https://www.youtube.com/playlist?list=PLu0W_9lII9ajyk081To1Cbt2eI5913SsL
PHP-https://www.youtube.com/playlist?list=PLu0W_9lII9aikXkRE0WxDt1vozo3hnmtR
C-https://www.youtube.com/playlist?list=PLu0W_9lII9aiXlHcLx-mDH1Qul38wD3aR
C++-https://www.youtube.com/playlist?list=PLu0W_9lII9agpFUAlPFe_VNSlXW5uE0YL
Git & GitHub-https://www.youtube.com/playlist?list=PLu0W_9lII9ahVQekD7ePHmnirTePXwIln
Android Dev- https://www.youtube.com/playlist?list=PLu0W_9lII9aiL0kysYlfSOUgY5rNlOhUd
Python GUI- https://www.youtube.com/playlist?list=PLu0W_9lII9ajLcqRcj4PoEihkukF_OTzA
Web Development- https://www.youtube.com/playlist?list=PLu0W_9lII9agiCUZYRsvtGTXdxkzPyItg
Python Django:https://www.youtube.com/playlist?list=PLu0W_9lII9ah7DDtYtflgwMwpT3xmjXY9
Projects Using HTML, CSS & Javascript- https://www.youtube.com/playlist?list=PLu0W_9lII9aiQiOwthuSvinxoflmhRxM3
Data Structure and Algo:https://www.youtube.com/playlist?list=PLu0W_9lII9ahIappRPN0MCAgtOu3lQjQi 

Follow Me On Social Media
►Website (created using Django Rest & Angular): https://www.codewithharry.com
►Facebook: https://www.facebook.com/CodeWithHarry
►Instagram: https://www.instagram.com/codewithharry/ 
Twitter: https://twitter.com/CodeWithHarry
Comment "#HarryBhai" if you read this 😉😉', '1167', 'cmm6gxh3g0007akrmcwd1jz2z', '13', NULL, 'https://i.ytimg.com/vi/ceiuLR2ysas/maxresdefault.jpg', 'If Else Conditional Statements in Python | Python Tutorial - Day #14', '2026-02-28T15:21:02.005Z', 'cmm0s6pyg0000i9evqafvt8x4', 'ceiuLR2ysas');
INSERT INTO public."Video" ("id", "createdAt", "description", "duration", "playlistId", "position", "scheduledAt", "thumbnail", "title", "updatedAt", "userId", "youtubeId") VALUES ('cmm6gxnlh0011akrmertioxew', '2026-02-28T15:21:02.646Z', 'Python is one of the most demanded programming languages in the job market. Surprisingly, it is equally easy to learn and master  Python. This python tutorial for absolute beginners in Hindi series will focus on teaching you python concepts from the ground up. 
Access the Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agwh1XjRt242xIpHhPT2llg
Link to the Repl: https://replit.com/@codewithharry/15-Day15-Exercise-2-Good-Morning-Sir
Join Replit the browser-based IDE used in this course - https://join.replit.com/code-with-harry-100-doc
►Checkout my English channel here: https://www.youtube.com/channel/UC7btqG2Ww0_2LwuQxpvo2HQ
►Instagram: www.instagram.com/codewithharry

python, C, C++, Java, JavaScript and Other Cheetsheets [++]:
Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agrsRZjFECeFuWY5ev2pQlk

►Learn in One Video[++]:
Python[15 Hr]: https://www.youtube.com/watch?v=gfDE2a7MKjA&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python Advance[3.5 Hr]: https://www.youtube.com/watch?v=61a7UkDO50s&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[1 Hr]: https://www.youtube.com/watch?v=qHJjMvHLJdg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[2 Hr]: https://www.youtube.com/watch?v=ihk_Xglr164&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[15 Min]:https://www.youtube.com/watch?v=fr1f84rg4Nw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JavaScript[1 Hr]: https://www.youtube.com/watch?v=onbBV0uFVpo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
C[1.3 Hr]-https://www.youtube.com/watch?v=YXcgD8hRHYY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[1 Hr]: https://www.youtube.com/watch?v=xW7ro3lwaCI&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[2.3 Hr]:https://www.youtube.com/watch?v=1SnPKhCdlsU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[Project]- https://www.youtube.com/watch?v=-al2bECumKg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
HTML[30 Min]:https://www.youtube.com/watch?v=E3ByCRqE7Lo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[8.5 Hr]:https://www.youtube.com/watch?v=Edsxf_NBFrw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[1.4 Hr]:https://www.youtube.com/watch?v=u5-K_ua9sOw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Wordpress[3.2 Hr]:https://www.youtube.com/watch?v=GlLRYml8mCY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Angular[2 Hr]:https://www.youtube.com/watch?v=0LhBvp8qpro&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Java[2.3 Hr]:https://www.youtube.com/watch?v=rV_3Lewxx6o&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Web Scraping[1 Hr]:https://www.youtube.com/watch?v=uufDGjTuq34&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
MongoDB[2 Hr]:https://www.youtube.com/watch?v=oSIv-E60NiU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Numpy[1 Hr]:https://www.youtube.com/watch?v=Rbh1rieb3zc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Android Dev[12 Hr]- https://www.youtube.com/watch?v=mXjZQX3UzOs
Linux[1 Hr]:https://www.youtube.com/watch?v=_tCY-c-sPZc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JQuery[1.1 Hr]:https://www.youtube.com/watch?v=YFlx1C8XwR0&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Git and GitHub[1.1 Hr]:https://www.youtube.com/watch?v=gwWKnnCMQ5c&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7

►Complete course [playlist]:
React: https://www.youtube.com/playlist?list=PLu0W_9lII9agx66oZnT6IyhcMIbUMNMdt
Python-https://www.youtube.com/playlist?list=PLu0W_9lII9agICnT8t4iYVSZ3eykIAOME
OOP Python-https://www.youtube.com/playlist?list=PLu0W_9lII9ahfRrhFcoB-4lpp9YaBmdCP
Java:https://www.youtube.com/playlist?list=PLu0W_9lII9agS67Uits0UnJyrYiXhDS6q
JavaScript- https://www.youtube.com/playlist?list=PLu0W_9lII9ajyk081To1Cbt2eI5913SsL
PHP-https://www.youtube.com/playlist?list=PLu0W_9lII9aikXkRE0WxDt1vozo3hnmtR
C-https://www.youtube.com/playlist?list=PLu0W_9lII9aiXlHcLx-mDH1Qul38wD3aR
C++-https://www.youtube.com/playlist?list=PLu0W_9lII9agpFUAlPFe_VNSlXW5uE0YL
Git & GitHub-https://www.youtube.com/playlist?list=PLu0W_9lII9ahVQekD7ePHmnirTePXwIln
Android Dev- https://www.youtube.com/playlist?list=PLu0W_9lII9aiL0kysYlfSOUgY5rNlOhUd
Python GUI- https://www.youtube.com/playlist?list=PLu0W_9lII9ajLcqRcj4PoEihkukF_OTzA
Web Development- https://www.youtube.com/playlist?list=PLu0W_9lII9agiCUZYRsvtGTXdxkzPyItg
Python Django:https://www.youtube.com/playlist?list=PLu0W_9lII9ah7DDtYtflgwMwpT3xmjXY9
Projects Using HTML, CSS & Javascript- https://www.youtube.com/playlist?list=PLu0W_9lII9aiQiOwthuSvinxoflmhRxM3
Data Structure and Algo:https://www.youtube.com/playlist?list=PLu0W_9lII9ahIappRPN0MCAgtOu3lQjQi 

Follow Me On Social Media
►Website (created using Django Rest & Angular): https://www.codewithharry.com
►Facebook: https://www.facebook.com/CodeWithHarry
►Instagram: https://www.instagram.com/codewithharry/ 
Twitter: https://twitter.com/CodeWithHarry
Comment "#HarryBhai" if you read this 😉😉', '319', 'cmm6gxh3g0007akrmcwd1jz2z', '14', NULL, 'https://i.ytimg.com/vi/d7ng_aV4qdI/maxresdefault.jpg', 'Exercise 2: Good Morning Sir | Python Tutorial - Day #15', '2026-02-28T15:21:02.646Z', 'cmm0s6pyg0000i9evqafvt8x4', 'd7ng_aV4qdI');
INSERT INTO public."Video" ("id", "createdAt", "description", "duration", "playlistId", "position", "scheduledAt", "thumbnail", "title", "updatedAt", "userId", "youtubeId") VALUES ('cmm6gxo1x0013akrms212w2wh', '2026-02-28T15:21:03.238Z', 'Python is one of the most demanded programming languages in the job market. Surprisingly, it is equally easy to learn and master  Python. This python tutorial for absolute beginners in Hindi series will focus on teaching you python concepts from the ground up. 
Access the Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agwh1XjRt242xIpHhPT2llg
Link to the Repl: https://replit.com/@codewithharry/16-Day-16-Match-Case#main.py
Join Replit the browser-based IDE used in this course - https://join.replit.com/code-with-harry-100-doc
►Checkout my English channel here: https://www.youtube.com/channel/UC7btqG2Ww0_2LwuQxpvo2HQ
►Instagram: www.instagram.com/codewithharry

python, C, C++, Java, JavaScript and Other Cheetsheets [++]:
Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agrsRZjFECeFuWY5ev2pQlk

►Learn in One Video[++]:
Python[15 Hr]: https://www.youtube.com/watch?v=gfDE2a7MKjA&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python Advance[3.5 Hr]: https://www.youtube.com/watch?v=61a7UkDO50s&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[1 Hr]: https://www.youtube.com/watch?v=qHJjMvHLJdg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[2 Hr]: https://www.youtube.com/watch?v=ihk_Xglr164&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[15 Min]:https://www.youtube.com/watch?v=fr1f84rg4Nw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JavaScript[1 Hr]: https://www.youtube.com/watch?v=onbBV0uFVpo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
C[1.3 Hr]-https://www.youtube.com/watch?v=YXcgD8hRHYY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[1 Hr]: https://www.youtube.com/watch?v=xW7ro3lwaCI&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[2.3 Hr]:https://www.youtube.com/watch?v=1SnPKhCdlsU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[Project]- https://www.youtube.com/watch?v=-al2bECumKg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
HTML[30 Min]:https://www.youtube.com/watch?v=E3ByCRqE7Lo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[8.5 Hr]:https://www.youtube.com/watch?v=Edsxf_NBFrw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[1.4 Hr]:https://www.youtube.com/watch?v=u5-K_ua9sOw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Wordpress[3.2 Hr]:https://www.youtube.com/watch?v=GlLRYml8mCY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Angular[2 Hr]:https://www.youtube.com/watch?v=0LhBvp8qpro&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Java[2.3 Hr]:https://www.youtube.com/watch?v=rV_3Lewxx6o&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Web Scraping[1 Hr]:https://www.youtube.com/watch?v=uufDGjTuq34&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
MongoDB[2 Hr]:https://www.youtube.com/watch?v=oSIv-E60NiU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Numpy[1 Hr]:https://www.youtube.com/watch?v=Rbh1rieb3zc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Android Dev[12 Hr]- https://www.youtube.com/watch?v=mXjZQX3UzOs
Linux[1 Hr]:https://www.youtube.com/watch?v=_tCY-c-sPZc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JQuery[1.1 Hr]:https://www.youtube.com/watch?v=YFlx1C8XwR0&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Git and GitHub[1.1 Hr]:https://www.youtube.com/watch?v=gwWKnnCMQ5c&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7

►Complete course [playlist]:
React: https://www.youtube.com/playlist?list=PLu0W_9lII9agx66oZnT6IyhcMIbUMNMdt
Python-https://www.youtube.com/playlist?list=PLu0W_9lII9agICnT8t4iYVSZ3eykIAOME
OOP Python-https://www.youtube.com/playlist?list=PLu0W_9lII9ahfRrhFcoB-4lpp9YaBmdCP
Java:https://www.youtube.com/playlist?list=PLu0W_9lII9agS67Uits0UnJyrYiXhDS6q
JavaScript- https://www.youtube.com/playlist?list=PLu0W_9lII9ajyk081To1Cbt2eI5913SsL
PHP-https://www.youtube.com/playlist?list=PLu0W_9lII9aikXkRE0WxDt1vozo3hnmtR
C-https://www.youtube.com/playlist?list=PLu0W_9lII9aiXlHcLx-mDH1Qul38wD3aR
C++-https://www.youtube.com/playlist?list=PLu0W_9lII9agpFUAlPFe_VNSlXW5uE0YL
Git & GitHub-https://www.youtube.com/playlist?list=PLu0W_9lII9ahVQekD7ePHmnirTePXwIln
Android Dev- https://www.youtube.com/playlist?list=PLu0W_9lII9aiL0kysYlfSOUgY5rNlOhUd
Python GUI- https://www.youtube.com/playlist?list=PLu0W_9lII9ajLcqRcj4PoEihkukF_OTzA
Web Development- https://www.youtube.com/playlist?list=PLu0W_9lII9agiCUZYRsvtGTXdxkzPyItg
Python Django:https://www.youtube.com/playlist?list=PLu0W_9lII9ah7DDtYtflgwMwpT3xmjXY9
Projects Using HTML, CSS & Javascript- https://www.youtube.com/playlist?list=PLu0W_9lII9aiQiOwthuSvinxoflmhRxM3
Data Structure and Algo:https://www.youtube.com/playlist?list=PLu0W_9lII9ahIappRPN0MCAgtOu3lQjQi 

Follow Me On Social Media
►Website (created using Django Rest & Angular): https://www.codewithharry.com
►Facebook: https://www.facebook.com/CodeWithHarry
►Instagram: https://www.instagram.com/codewithharry/ 
Twitter: https://twitter.com/CodeWithHarry
Comment "#HarryBhai" if you read this 😉😉', '491', 'cmm6gxh3g0007akrmcwd1jz2z', '15', NULL, 'https://i.ytimg.com/vi/bthQCK1QAmQ/maxresdefault.jpg', 'Match Case Statements in Python | Python Tutorial - Day #16', '2026-02-28T15:21:03.238Z', 'cmm0s6pyg0000i9evqafvt8x4', 'bthQCK1QAmQ');
INSERT INTO public."Video" ("id", "createdAt", "description", "duration", "playlistId", "position", "scheduledAt", "thumbnail", "title", "updatedAt", "userId", "youtubeId") VALUES ('cmm6gxodi0015akrmx82y2kgs', '2026-02-28T15:21:03.654Z', 'Python is one of the most demanded programming languages in the job market. Surprisingly, it is equally easy to learn and master  Python. This python tutorial for absolute beginners in Hindi series will focus on teaching you python concepts from the ground up. 
Access the Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agwh1XjRt242xIpHhPT2llg
Link to the Repl: https://replit.com/@codewithharry/17-Day17-For-Loops#main.py
Join Replit the browser-based IDE used in this course - https://join.replit.com/code-with-harry-100-doc
►Checkout my English channel here: https://www.youtube.com/channel/UC7btqG2Ww0_2LwuQxpvo2HQ
►Instagram: www.instagram.com/codewithharry

python, C, C++, Java, JavaScript and Other Cheetsheets [++]:
Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agrsRZjFECeFuWY5ev2pQlk

►Learn in One Video[++]:
Python[15 Hr]: https://www.youtube.com/watch?v=gfDE2a7MKjA&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python Advance[3.5 Hr]: https://www.youtube.com/watch?v=61a7UkDO50s&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[1 Hr]: https://www.youtube.com/watch?v=qHJjMvHLJdg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[2 Hr]: https://www.youtube.com/watch?v=ihk_Xglr164&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[15 Min]:https://www.youtube.com/watch?v=fr1f84rg4Nw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JavaScript[1 Hr]: https://www.youtube.com/watch?v=onbBV0uFVpo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
C[1.3 Hr]-https://www.youtube.com/watch?v=YXcgD8hRHYY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[1 Hr]: https://www.youtube.com/watch?v=xW7ro3lwaCI&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[2.3 Hr]:https://www.youtube.com/watch?v=1SnPKhCdlsU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[Project]- https://www.youtube.com/watch?v=-al2bECumKg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
HTML[30 Min]:https://www.youtube.com/watch?v=E3ByCRqE7Lo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[8.5 Hr]:https://www.youtube.com/watch?v=Edsxf_NBFrw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[1.4 Hr]:https://www.youtube.com/watch?v=u5-K_ua9sOw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Wordpress[3.2 Hr]:https://www.youtube.com/watch?v=GlLRYml8mCY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Angular[2 Hr]:https://www.youtube.com/watch?v=0LhBvp8qpro&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Java[2.3 Hr]:https://www.youtube.com/watch?v=rV_3Lewxx6o&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Web Scraping[1 Hr]:https://www.youtube.com/watch?v=uufDGjTuq34&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
MongoDB[2 Hr]:https://www.youtube.com/watch?v=oSIv-E60NiU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Numpy[1 Hr]:https://www.youtube.com/watch?v=Rbh1rieb3zc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Android Dev[12 Hr]- https://www.youtube.com/watch?v=mXjZQX3UzOs
Linux[1 Hr]:https://www.youtube.com/watch?v=_tCY-c-sPZc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JQuery[1.1 Hr]:https://www.youtube.com/watch?v=YFlx1C8XwR0&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Git and GitHub[1.1 Hr]:https://www.youtube.com/watch?v=gwWKnnCMQ5c&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7

►Complete course [playlist]:
React: https://www.youtube.com/playlist?list=PLu0W_9lII9agx66oZnT6IyhcMIbUMNMdt
Python-https://www.youtube.com/playlist?list=PLu0W_9lII9agICnT8t4iYVSZ3eykIAOME
OOP Python-https://www.youtube.com/playlist?list=PLu0W_9lII9ahfRrhFcoB-4lpp9YaBmdCP
Java:https://www.youtube.com/playlist?list=PLu0W_9lII9agS67Uits0UnJyrYiXhDS6q
JavaScript- https://www.youtube.com/playlist?list=PLu0W_9lII9ajyk081To1Cbt2eI5913SsL
PHP-https://www.youtube.com/playlist?list=PLu0W_9lII9aikXkRE0WxDt1vozo3hnmtR
C-https://www.youtube.com/playlist?list=PLu0W_9lII9aiXlHcLx-mDH1Qul38wD3aR
C++-https://www.youtube.com/playlist?list=PLu0W_9lII9agpFUAlPFe_VNSlXW5uE0YL
Git & GitHub-https://www.youtube.com/playlist?list=PLu0W_9lII9ahVQekD7ePHmnirTePXwIln
Android Dev- https://www.youtube.com/playlist?list=PLu0W_9lII9aiL0kysYlfSOUgY5rNlOhUd
Python GUI- https://www.youtube.com/playlist?list=PLu0W_9lII9ajLcqRcj4PoEihkukF_OTzA
Web Development- https://www.youtube.com/playlist?list=PLu0W_9lII9agiCUZYRsvtGTXdxkzPyItg
Python Django:https://www.youtube.com/playlist?list=PLu0W_9lII9ah7DDtYtflgwMwpT3xmjXY9
Projects Using HTML, CSS & Javascript- https://www.youtube.com/playlist?list=PLu0W_9lII9aiQiOwthuSvinxoflmhRxM3
Data Structure and Algo:https://www.youtube.com/playlist?list=PLu0W_9lII9ahIappRPN0MCAgtOu3lQjQi 

Follow Me On Social Media
►Website (created using Django Rest & Angular): https://www.codewithharry.com
►Facebook: https://www.facebook.com/CodeWithHarry
►Instagram: https://www.instagram.com/codewithharry/ 
Twitter: https://twitter.com/CodeWithHarry
Comment "#HarryBhai" if you read this 😉😉', '781', 'cmm6gxh3g0007akrmcwd1jz2z', '16', NULL, 'https://i.ytimg.com/vi/fIYVzKp0q5w/maxresdefault.jpg', 'For Loops in Python | Python Tutorial - Day #17', '2026-02-28T15:21:03.654Z', 'cmm0s6pyg0000i9evqafvt8x4', 'fIYVzKp0q5w');
INSERT INTO public."Video" ("id", "createdAt", "description", "duration", "playlistId", "position", "scheduledAt", "thumbnail", "title", "updatedAt", "userId", "youtubeId") VALUES ('cmm6gxop40017akrm0j4quzmw', '2026-02-28T15:21:04.072Z', 'Python is one of the most demanded programming languages in the job market. Surprisingly, it is equally easy to learn and master  Python. This python tutorial for absolute beginners in Hindi series will focus on teaching you python concepts from the ground up. 
Access the Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agwh1XjRt242xIpHhPT2llg
Link to the Repl: https://replit.com/@codewithharry/18-Day18-While-Loops#main.py
Join Replit the browser-based IDE used in this course - https://join.replit.com/code-with-harry-100-doc
►Checkout my English channel here: https://www.youtube.com/channel/UC7btqG2Ww0_2LwuQxpvo2HQ
►Instagram: www.instagram.com/codewithharry

python, C, C++, Java, JavaScript and Other Cheetsheets [++]:
Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agrsRZjFECeFuWY5ev2pQlk

►Learn in One Video[++]:
Python[15 Hr]: https://www.youtube.com/watch?v=gfDE2a7MKjA&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python Advance[3.5 Hr]: https://www.youtube.com/watch?v=61a7UkDO50s&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[1 Hr]: https://www.youtube.com/watch?v=qHJjMvHLJdg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[2 Hr]: https://www.youtube.com/watch?v=ihk_Xglr164&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[15 Min]:https://www.youtube.com/watch?v=fr1f84rg4Nw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JavaScript[1 Hr]: https://www.youtube.com/watch?v=onbBV0uFVpo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
C[1.3 Hr]-https://www.youtube.com/watch?v=YXcgD8hRHYY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[1 Hr]: https://www.youtube.com/watch?v=xW7ro3lwaCI&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[2.3 Hr]:https://www.youtube.com/watch?v=1SnPKhCdlsU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[Project]- https://www.youtube.com/watch?v=-al2bECumKg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
HTML[30 Min]:https://www.youtube.com/watch?v=E3ByCRqE7Lo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[8.5 Hr]:https://www.youtube.com/watch?v=Edsxf_NBFrw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[1.4 Hr]:https://www.youtube.com/watch?v=u5-K_ua9sOw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Wordpress[3.2 Hr]:https://www.youtube.com/watch?v=GlLRYml8mCY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Angular[2 Hr]:https://www.youtube.com/watch?v=0LhBvp8qpro&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Java[2.3 Hr]:https://www.youtube.com/watch?v=rV_3Lewxx6o&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Web Scraping[1 Hr]:https://www.youtube.com/watch?v=uufDGjTuq34&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
MongoDB[2 Hr]:https://www.youtube.com/watch?v=oSIv-E60NiU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Numpy[1 Hr]:https://www.youtube.com/watch?v=Rbh1rieb3zc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Android Dev[12 Hr]- https://www.youtube.com/watch?v=mXjZQX3UzOs
Linux[1 Hr]:https://www.youtube.com/watch?v=_tCY-c-sPZc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JQuery[1.1 Hr]:https://www.youtube.com/watch?v=YFlx1C8XwR0&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Git and GitHub[1.1 Hr]:https://www.youtube.com/watch?v=gwWKnnCMQ5c&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7

►Complete course [playlist]:
React: https://www.youtube.com/playlist?list=PLu0W_9lII9agx66oZnT6IyhcMIbUMNMdt
Python-https://www.youtube.com/playlist?list=PLu0W_9lII9agICnT8t4iYVSZ3eykIAOME
OOP Python-https://www.youtube.com/playlist?list=PLu0W_9lII9ahfRrhFcoB-4lpp9YaBmdCP
Java:https://www.youtube.com/playlist?list=PLu0W_9lII9agS67Uits0UnJyrYiXhDS6q
JavaScript- https://www.youtube.com/playlist?list=PLu0W_9lII9ajyk081To1Cbt2eI5913SsL
PHP-https://www.youtube.com/playlist?list=PLu0W_9lII9aikXkRE0WxDt1vozo3hnmtR
C-https://www.youtube.com/playlist?list=PLu0W_9lII9aiXlHcLx-mDH1Qul38wD3aR
C++-https://www.youtube.com/playlist?list=PLu0W_9lII9agpFUAlPFe_VNSlXW5uE0YL
Git & GitHub-https://www.youtube.com/playlist?list=PLu0W_9lII9ahVQekD7ePHmnirTePXwIln
Android Dev- https://www.youtube.com/playlist?list=PLu0W_9lII9aiL0kysYlfSOUgY5rNlOhUd
Python GUI- https://www.youtube.com/playlist?list=PLu0W_9lII9ajLcqRcj4PoEihkukF_OTzA
Web Development- https://www.youtube.com/playlist?list=PLu0W_9lII9agiCUZYRsvtGTXdxkzPyItg
Python Django:https://www.youtube.com/playlist?list=PLu0W_9lII9ah7DDtYtflgwMwpT3xmjXY9
Projects Using HTML, CSS & Javascript- https://www.youtube.com/playlist?list=PLu0W_9lII9aiQiOwthuSvinxoflmhRxM3
Data Structure and Algo:https://www.youtube.com/playlist?list=PLu0W_9lII9ahIappRPN0MCAgtOu3lQjQi 

Follow Me On Social Media
►Website (created using Django Rest & Angular): https://www.codewithharry.com
►Facebook: https://www.facebook.com/CodeWithHarry
►Instagram: https://www.instagram.com/codewithharry/ 
Twitter: https://twitter.com/CodeWithHarry
Comment "#HarryBhai" if you read this 😉😉', '850', 'cmm6gxh3g0007akrmcwd1jz2z', '17', NULL, 'https://i.ytimg.com/vi/-tCFyIyKVx0/maxresdefault.jpg', 'While Loops in Python | Python Tutorial - Day #18', '2026-02-28T15:21:04.072Z', 'cmm0s6pyg0000i9evqafvt8x4', '-tCFyIyKVx0');
INSERT INTO public."Video" ("id", "createdAt", "description", "duration", "playlistId", "position", "scheduledAt", "thumbnail", "title", "updatedAt", "userId", "youtubeId") VALUES ('cmm6gxp0b0019akrmnipmwovv', '2026-02-28T15:21:04.475Z', 'Python is one of the most demanded programming languages in the job market. Surprisingly, it is equally easy to learn and master  Python. This python tutorial for absolute beginners in Hindi series will focus on teaching you python concepts from the ground up. 
Access the Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agwh1XjRt242xIpHhPT2llg
Link to the Repl: https://replit.com/@codewithharry/19-Day-19-break-and-continue#main.py
Join Replit the browser-based IDE used in this course - https://join.replit.com/code-with-harry-100-doc
►Checkout my English channel here: https://www.youtube.com/channel/UC7btqG2Ww0_2LwuQxpvo2HQ
►Instagram: www.instagram.com/codewithharry

python, C, C++, Java, JavaScript and Other Cheatsheets [++]:
Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agrsRZjFECeFuWY5ev2pQlk

►Learn in One Video[++]:
Python[15 Hr]: https://www.youtube.com/watch?v=gfDE2a7MKjA&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python Advance[3.5 Hr]: https://www.youtube.com/watch?v=61a7UkDO50s&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[1 Hr]: https://www.youtube.com/watch?v=qHJjMvHLJdg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[2 Hr]: https://www.youtube.com/watch?v=ihk_Xglr164&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[15 Min]:https://www.youtube.com/watch?v=fr1f84rg4Nw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JavaScript[1 Hr]: https://www.youtube.com/watch?v=onbBV0uFVpo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
C[1.3 Hr]-https://www.youtube.com/watch?v=YXcgD8hRHYY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[1 Hr]: https://www.youtube.com/watch?v=xW7ro3lwaCI&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[2.3 Hr]:https://www.youtube.com/watch?v=1SnPKhCdlsU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[Project]- https://www.youtube.com/watch?v=-al2bECumKg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
HTML[30 Min]:https://www.youtube.com/watch?v=E3ByCRqE7Lo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[8.5 Hr]:https://www.youtube.com/watch?v=Edsxf_NBFrw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[1.4 Hr]:https://www.youtube.com/watch?v=u5-K_ua9sOw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Wordpress[3.2 Hr]:https://www.youtube.com/watch?v=GlLRYml8mCY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Angular[2 Hr]:https://www.youtube.com/watch?v=0LhBvp8qpro&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Java[2.3 Hr]:https://www.youtube.com/watch?v=rV_3Lewxx6o&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Web Scraping[1 Hr]:https://www.youtube.com/watch?v=uufDGjTuq34&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
MongoDB[2 Hr]:https://www.youtube.com/watch?v=oSIv-E60NiU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Numpy[1 Hr]:https://www.youtube.com/watch?v=Rbh1rieb3zc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Android Dev[12 Hr]- https://www.youtube.com/watch?v=mXjZQX3UzOs
Linux[1 Hr]:https://www.youtube.com/watch?v=_tCY-c-sPZc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JQuery[1.1 Hr]:https://www.youtube.com/watch?v=YFlx1C8XwR0&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Git and GitHub[1.1 Hr]:https://www.youtube.com/watch?v=gwWKnnCMQ5c&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7

►Complete course [playlist]:
React: https://www.youtube.com/playlist?list=PLu0W_9lII9agx66oZnT6IyhcMIbUMNMdt
Python-https://www.youtube.com/playlist?list=PLu0W_9lII9agICnT8t4iYVSZ3eykIAOME
OOP Python-https://www.youtube.com/playlist?list=PLu0W_9lII9ahfRrhFcoB-4lpp9YaBmdCP
Java:https://www.youtube.com/playlist?list=PLu0W_9lII9agS67Uits0UnJyrYiXhDS6q
JavaScript- https://www.youtube.com/playlist?list=PLu0W_9lII9ajyk081To1Cbt2eI5913SsL
PHP-https://www.youtube.com/playlist?list=PLu0W_9lII9aikXkRE0WxDt1vozo3hnmtR
C-https://www.youtube.com/playlist?list=PLu0W_9lII9aiXlHcLx-mDH1Qul38wD3aR
C++-https://www.youtube.com/playlist?list=PLu0W_9lII9agpFUAlPFe_VNSlXW5uE0YL
Git & GitHub-https://www.youtube.com/playlist?list=PLu0W_9lII9ahVQekD7ePHmnirTePXwIln
Android Dev- https://www.youtube.com/playlist?list=PLu0W_9lII9aiL0kysYlfSOUgY5rNlOhUd
Python GUI- https://www.youtube.com/playlist?list=PLu0W_9lII9ajLcqRcj4PoEihkukF_OTzA
Web Development- https://www.youtube.com/playlist?list=PLu0W_9lII9agiCUZYRsvtGTXdxkzPyItg
Python Django:https://www.youtube.com/playlist?list=PLu0W_9lII9ah7DDtYtflgwMwpT3xmjXY9
Projects Using HTML, CSS & Javascript- https://www.youtube.com/playlist?list=PLu0W_9lII9aiQiOwthuSvinxoflmhRxM3
Data Structure and Algo:https://www.youtube.com/playlist?list=PLu0W_9lII9ahIappRPN0MCAgtOu3lQjQi 

Follow Me On Social Media
►Website (created using Django Rest & Angular): https://www.codewithharry.com
►Facebook: https://www.facebook.com/CodeWithHarry
►Instagram: https://www.instagram.com/codewithharry/ 
Twitter: https://twitter.com/CodeWithHarry
Comment "#HarryBhai" if you read this 😉😉', '734', 'cmm6gxh3g0007akrmcwd1jz2z', '18', NULL, 'https://i.ytimg.com/vi/RkwJnjdrm70/maxresdefault.jpg', 'break and continue in Python | Python Tutorial - Day #19', '2026-02-28T15:21:04.475Z', 'cmm0s6pyg0000i9evqafvt8x4', 'RkwJnjdrm70');
INSERT INTO public."Video" ("id", "createdAt", "description", "duration", "playlistId", "position", "scheduledAt", "thumbnail", "title", "updatedAt", "userId", "youtubeId") VALUES ('cmm6gxp8w001bakrmuqx0a8hj', '2026-02-28T15:21:04.784Z', 'Python is one of the most demanded programming languages in the job market. Surprisingly, it is equally easy to learn and master  Python. This python tutorial for absolute beginners in Hindi series will focus on teaching you python concepts from the ground up. 
Access the Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agwh1XjRt242xIpHhPT2llg
Link to the Repl: https://replit.com/@codewithharry/20-Day20-Functions#main.py
Join Replit the browser-based IDE used in this course - https://join.replit.com/code-with-harry-100-doc
►Checkout my English channel here: https://www.youtube.com/channel/UC7btqG2Ww0_2LwuQxpvo2HQ
►Instagram: www.instagram.com/codewithharry

python, C, C++, Java, JavaScript and Other Cheetsheets [++]:
Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agrsRZjFECeFuWY5ev2pQlk

►Learn in One Video[++]:
Python[15 Hr]: https://www.youtube.com/watch?v=gfDE2a7MKjA&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python Advance[3.5 Hr]: https://www.youtube.com/watch?v=61a7UkDO50s&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[1 Hr]: https://www.youtube.com/watch?v=qHJjMvHLJdg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[2 Hr]: https://www.youtube.com/watch?v=ihk_Xglr164&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[15 Min]:https://www.youtube.com/watch?v=fr1f84rg4Nw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JavaScript[1 Hr]: https://www.youtube.com/watch?v=onbBV0uFVpo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
C[1.3 Hr]-https://www.youtube.com/watch?v=YXcgD8hRHYY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[1 Hr]: https://www.youtube.com/watch?v=xW7ro3lwaCI&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[2.3 Hr]:https://www.youtube.com/watch?v=1SnPKhCdlsU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[Project]- https://www.youtube.com/watch?v=-al2bECumKg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
HTML[30 Min]:https://www.youtube.com/watch?v=E3ByCRqE7Lo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[8.5 Hr]:https://www.youtube.com/watch?v=Edsxf_NBFrw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[1.4 Hr]:https://www.youtube.com/watch?v=u5-K_ua9sOw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Wordpress[3.2 Hr]:https://www.youtube.com/watch?v=GlLRYml8mCY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Angular[2 Hr]:https://www.youtube.com/watch?v=0LhBvp8qpro&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Java[2.3 Hr]:https://www.youtube.com/watch?v=rV_3Lewxx6o&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Web Scraping[1 Hr]:https://www.youtube.com/watch?v=uufDGjTuq34&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
MongoDB[2 Hr]:https://www.youtube.com/watch?v=oSIv-E60NiU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Numpy[1 Hr]:https://www.youtube.com/watch?v=Rbh1rieb3zc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Android Dev[12 Hr]- https://www.youtube.com/watch?v=mXjZQX3UzOs
Linux[1 Hr]:https://www.youtube.com/watch?v=_tCY-c-sPZc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JQuery[1.1 Hr]:https://www.youtube.com/watch?v=YFlx1C8XwR0&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Git and GitHub[1.1 Hr]:https://www.youtube.com/watch?v=gwWKnnCMQ5c&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7

►Complete course [playlist]:
React: https://www.youtube.com/playlist?list=PLu0W_9lII9agx66oZnT6IyhcMIbUMNMdt
Python-https://www.youtube.com/playlist?list=PLu0W_9lII9agICnT8t4iYVSZ3eykIAOME
OOP Python-https://www.youtube.com/playlist?list=PLu0W_9lII9ahfRrhFcoB-4lpp9YaBmdCP
Java:https://www.youtube.com/playlist?list=PLu0W_9lII9agS67Uits0UnJyrYiXhDS6q
JavaScript- https://www.youtube.com/playlist?list=PLu0W_9lII9ajyk081To1Cbt2eI5913SsL
PHP-https://www.youtube.com/playlist?list=PLu0W_9lII9aikXkRE0WxDt1vozo3hnmtR
C-https://www.youtube.com/playlist?list=PLu0W_9lII9aiXlHcLx-mDH1Qul38wD3aR
C++-https://www.youtube.com/playlist?list=PLu0W_9lII9agpFUAlPFe_VNSlXW5uE0YL
Git & GitHub-https://www.youtube.com/playlist?list=PLu0W_9lII9ahVQekD7ePHmnirTePXwIln
Android Dev- https://www.youtube.com/playlist?list=PLu0W_9lII9aiL0kysYlfSOUgY5rNlOhUd
Python GUI- https://www.youtube.com/playlist?list=PLu0W_9lII9ajLcqRcj4PoEihkukF_OTzA
Web Development- https://www.youtube.com/playlist?list=PLu0W_9lII9agiCUZYRsvtGTXdxkzPyItg
Python Django:https://www.youtube.com/playlist?list=PLu0W_9lII9ah7DDtYtflgwMwpT3xmjXY9
Projects Using HTML, CSS & Javascript- https://www.youtube.com/playlist?list=PLu0W_9lII9aiQiOwthuSvinxoflmhRxM3
Data Structure and Algo:https://www.youtube.com/playlist?list=PLu0W_9lII9ahIappRPN0MCAgtOu3lQjQi 

Follow Me On Social Media
►Website (created using Django Rest & Angular): https://www.codewithharry.com
►Facebook: https://www.facebook.com/CodeWithHarry
►Instagram: https://www.instagram.com/codewithharry/ 
Twitter: https://twitter.com/CodeWithHarry
Comment "#HarryBhai" if you read this 😉😉', '978', 'cmm6gxh3g0007akrmcwd1jz2z', '19', NULL, 'https://i.ytimg.com/vi/dyvxxJSGUsE/maxresdefault.jpg', 'Functions in Python | Python Tutorial - Day #20', '2026-02-28T15:21:04.784Z', 'cmm0s6pyg0000i9evqafvt8x4', 'dyvxxJSGUsE');
INSERT INTO public."Video" ("id", "createdAt", "description", "duration", "playlistId", "position", "scheduledAt", "thumbnail", "title", "updatedAt", "userId", "youtubeId") VALUES ('cmm6gxphg001dakrmfmsy3j9o', '2026-02-28T15:21:05.092Z', 'Python is one of the most demanded programming languages in the job market. Surprisingly, it is equally easy to learn and master  Python. This python tutorial for absolute beginners in Hindi series will focus on teaching you python concepts from the ground up. 
Access the Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agwh1XjRt242xIpHhPT2llg
Link to the Repl: https://replit.com/@codewithharry/21-Day-21-Function-Arguments#main.py
Join Replit the browser-based IDE used in this course - https://join.replit.com/code-with-harry-100-doc
►Checkout my English channel here: https://www.youtube.com/channel/UC7btqG2Ww0_2LwuQxpvo2HQ
►Instagram: www.instagram.com/codewithharry

python, C, C++, Java, JavaScript and Other Cheetsheets [++]:
Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agrsRZjFECeFuWY5ev2pQlk

►Learn in One Video[++]:
Python[15 Hr]: https://www.youtube.com/watch?v=gfDE2a7MKjA&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python Advance[3.5 Hr]: https://www.youtube.com/watch?v=61a7UkDO50s&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[1 Hr]: https://www.youtube.com/watch?v=qHJjMvHLJdg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[2 Hr]: https://www.youtube.com/watch?v=ihk_Xglr164&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[15 Min]:https://www.youtube.com/watch?v=fr1f84rg4Nw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JavaScript[1 Hr]: https://www.youtube.com/watch?v=onbBV0uFVpo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
C[1.3 Hr]-https://www.youtube.com/watch?v=YXcgD8hRHYY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[1 Hr]: https://www.youtube.com/watch?v=xW7ro3lwaCI&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[2.3 Hr]:https://www.youtube.com/watch?v=1SnPKhCdlsU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[Project]- https://www.youtube.com/watch?v=-al2bECumKg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
HTML[30 Min]:https://www.youtube.com/watch?v=E3ByCRqE7Lo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[8.5 Hr]:https://www.youtube.com/watch?v=Edsxf_NBFrw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[1.4 Hr]:https://www.youtube.com/watch?v=u5-K_ua9sOw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Wordpress[3.2 Hr]:https://www.youtube.com/watch?v=GlLRYml8mCY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Angular[2 Hr]:https://www.youtube.com/watch?v=0LhBvp8qpro&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Java[2.3 Hr]:https://www.youtube.com/watch?v=rV_3Lewxx6o&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Web Scraping[1 Hr]:https://www.youtube.com/watch?v=uufDGjTuq34&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
MongoDB[2 Hr]:https://www.youtube.com/watch?v=oSIv-E60NiU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Numpy[1 Hr]:https://www.youtube.com/watch?v=Rbh1rieb3zc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Android Dev[12 Hr]- https://www.youtube.com/watch?v=mXjZQX3UzOs
Linux[1 Hr]:https://www.youtube.com/watch?v=_tCY-c-sPZc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JQuery[1.1 Hr]:https://www.youtube.com/watch?v=YFlx1C8XwR0&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Git and GitHub[1.1 Hr]:https://www.youtube.com/watch?v=gwWKnnCMQ5c&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7

►Complete course [playlist]:
React: https://www.youtube.com/playlist?list=PLu0W_9lII9agx66oZnT6IyhcMIbUMNMdt
Python-https://www.youtube.com/playlist?list=PLu0W_9lII9agICnT8t4iYVSZ3eykIAOME
OOP Python-https://www.youtube.com/playlist?list=PLu0W_9lII9ahfRrhFcoB-4lpp9YaBmdCP
Java:https://www.youtube.com/playlist?list=PLu0W_9lII9agS67Uits0UnJyrYiXhDS6q
JavaScript- https://www.youtube.com/playlist?list=PLu0W_9lII9ajyk081To1Cbt2eI5913SsL
PHP-https://www.youtube.com/playlist?list=PLu0W_9lII9aikXkRE0WxDt1vozo3hnmtR
C-https://www.youtube.com/playlist?list=PLu0W_9lII9aiXlHcLx-mDH1Qul38wD3aR
C++-https://www.youtube.com/playlist?list=PLu0W_9lII9agpFUAlPFe_VNSlXW5uE0YL
Git & GitHub-https://www.youtube.com/playlist?list=PLu0W_9lII9ahVQekD7ePHmnirTePXwIln
Android Dev- https://www.youtube.com/playlist?list=PLu0W_9lII9aiL0kysYlfSOUgY5rNlOhUd
Python GUI- https://www.youtube.com/playlist?list=PLu0W_9lII9ajLcqRcj4PoEihkukF_OTzA
Web Development- https://www.youtube.com/playlist?list=PLu0W_9lII9agiCUZYRsvtGTXdxkzPyItg
Python Django:https://www.youtube.com/playlist?list=PLu0W_9lII9ah7DDtYtflgwMwpT3xmjXY9
Projects Using HTML, CSS & Javascript- https://www.youtube.com/playlist?list=PLu0W_9lII9aiQiOwthuSvinxoflmhRxM3
Data Structure and Algo:https://www.youtube.com/playlist?list=PLu0W_9lII9ahIappRPN0MCAgtOu3lQjQi 

Follow Me On Social Media
►Website (created using Django Rest & Angular): https://www.codewithharry.com
►Facebook: https://www.facebook.com/CodeWithHarry
►Instagram: https://www.instagram.com/codewithharry/ 
Twitter: https://twitter.com/CodeWithHarry
Comment "#HarryBhai" if you read this 😉😉', '830', 'cmm6gxh3g0007akrmcwd1jz2z', '20', NULL, 'https://i.ytimg.com/vi/0d6b6fFuCkE/maxresdefault.jpg', 'Function Arguments in Python | Python Tutorial - Day #21', '2026-02-28T15:21:05.092Z', 'cmm0s6pyg0000i9evqafvt8x4', '0d6b6fFuCkE');
INSERT INTO public."Video" ("id", "createdAt", "description", "duration", "playlistId", "position", "scheduledAt", "thumbnail", "title", "updatedAt", "userId", "youtubeId") VALUES ('cmm6gxpq3001fakrmg1dvkyox', '2026-02-28T15:21:05.403Z', 'Python is one of the most demanded programming languages in the job market. Surprisingly, it is equally easy to learn and master  Python. This python tutorial for absolute beginners in Hindi series will focus on teaching you python concepts from the ground up. 
Access the Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agwh1XjRt242xIpHhPT2llg
Link to the Repl: https://replit.com/@codewithharry/22-Day-22-Introduction-to-Lists
Join Replit the browser-based IDE used in this course - https://join.replit.com/code-with-harry-100-doc
►Checkout my English channel here: https://www.youtube.com/channel/UC7btqG2Ww0_2LwuQxpvo2HQ
►Instagram: www.instagram.com/codewithharry

python, C, C++, Java, JavaScript and Other Cheetsheets [++]:
Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agrsRZjFECeFuWY5ev2pQlk

►Learn in One Video[++]:
Python[15 Hr]: https://www.youtube.com/watch?v=gfDE2a7MKjA&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python Advance[3.5 Hr]: https://www.youtube.com/watch?v=61a7UkDO50s&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[1 Hr]: https://www.youtube.com/watch?v=qHJjMvHLJdg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[2 Hr]: https://www.youtube.com/watch?v=ihk_Xglr164&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[15 Min]:https://www.youtube.com/watch?v=fr1f84rg4Nw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JavaScript[1 Hr]: https://www.youtube.com/watch?v=onbBV0uFVpo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
C[1.3 Hr]-https://www.youtube.com/watch?v=YXcgD8hRHYY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[1 Hr]: https://www.youtube.com/watch?v=xW7ro3lwaCI&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[2.3 Hr]:https://www.youtube.com/watch?v=1SnPKhCdlsU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[Project]- https://www.youtube.com/watch?v=-al2bECumKg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
HTML[30 Min]:https://www.youtube.com/watch?v=E3ByCRqE7Lo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[8.5 Hr]:https://www.youtube.com/watch?v=Edsxf_NBFrw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[1.4 Hr]:https://www.youtube.com/watch?v=u5-K_ua9sOw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Wordpress[3.2 Hr]:https://www.youtube.com/watch?v=GlLRYml8mCY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Angular[2 Hr]:https://www.youtube.com/watch?v=0LhBvp8qpro&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Java[2.3 Hr]:https://www.youtube.com/watch?v=rV_3Lewxx6o&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Web Scraping[1 Hr]:https://www.youtube.com/watch?v=uufDGjTuq34&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
MongoDB[2 Hr]:https://www.youtube.com/watch?v=oSIv-E60NiU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Numpy[1 Hr]:https://www.youtube.com/watch?v=Rbh1rieb3zc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Android Dev[12 Hr]- https://www.youtube.com/watch?v=mXjZQX3UzOs
Linux[1 Hr]:https://www.youtube.com/watch?v=_tCY-c-sPZc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JQuery[1.1 Hr]:https://www.youtube.com/watch?v=YFlx1C8XwR0&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Git and GitHub[1.1 Hr]:https://www.youtube.com/watch?v=gwWKnnCMQ5c&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7

►Complete course [playlist]:
React: https://www.youtube.com/playlist?list=PLu0W_9lII9agx66oZnT6IyhcMIbUMNMdt
Python-https://www.youtube.com/playlist?list=PLu0W_9lII9agICnT8t4iYVSZ3eykIAOME
OOP Python-https://www.youtube.com/playlist?list=PLu0W_9lII9ahfRrhFcoB-4lpp9YaBmdCP
Java:https://www.youtube.com/playlist?list=PLu0W_9lII9agS67Uits0UnJyrYiXhDS6q
JavaScript- https://www.youtube.com/playlist?list=PLu0W_9lII9ajyk081To1Cbt2eI5913SsL
PHP-https://www.youtube.com/playlist?list=PLu0W_9lII9aikXkRE0WxDt1vozo3hnmtR
C-https://www.youtube.com/playlist?list=PLu0W_9lII9aiXlHcLx-mDH1Qul38wD3aR
C++-https://www.youtube.com/playlist?list=PLu0W_9lII9agpFUAlPFe_VNSlXW5uE0YL
Git & GitHub-https://www.youtube.com/playlist?list=PLu0W_9lII9ahVQekD7ePHmnirTePXwIln
Android Dev- https://www.youtube.com/playlist?list=PLu0W_9lII9aiL0kysYlfSOUgY5rNlOhUd
Python GUI- https://www.youtube.com/playlist?list=PLu0W_9lII9ajLcqRcj4PoEihkukF_OTzA
Web Development- https://www.youtube.com/playlist?list=PLu0W_9lII9agiCUZYRsvtGTXdxkzPyItg
Python Django:https://www.youtube.com/playlist?list=PLu0W_9lII9ah7DDtYtflgwMwpT3xmjXY9
Projects Using HTML, CSS & Javascript- https://www.youtube.com/playlist?list=PLu0W_9lII9aiQiOwthuSvinxoflmhRxM3
Data Structure and Algo:https://www.youtube.com/playlist?list=PLu0W_9lII9ahIappRPN0MCAgtOu3lQjQi 

Follow Me On Social Media
►Website (created using Django Rest & Angular): https://www.codewithharry.com
►Facebook: https://www.facebook.com/CodeWithHarry
►Instagram: https://www.instagram.com/codewithharry/ 
Twitter: https://twitter.com/CodeWithHarry
Comment "#HarryBhai" if you read this 😉😉', '1207', 'cmm6gxh3g0007akrmcwd1jz2z', '21', NULL, 'https://i.ytimg.com/vi/eF6nK5bSlmg/maxresdefault.jpg', 'Introduction to Lists in Python | Python Tutorial - Day #22', '2026-02-28T15:21:05.403Z', 'cmm0s6pyg0000i9evqafvt8x4', 'eF6nK5bSlmg');
INSERT INTO public."Video" ("id", "createdAt", "description", "duration", "playlistId", "position", "scheduledAt", "thumbnail", "title", "updatedAt", "userId", "youtubeId") VALUES ('cmm6gxpyn001hakrm9uqpp7la', '2026-02-28T15:21:05.711Z', 'Python is one of the most demanded programming languages in the job market. Surprisingly, it is equally easy to learn and master  Python. This python tutorial for absolute beginners in Hindi series will focus on teaching you python concepts from the ground up. 
Access the Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agwh1XjRt242xIpHhPT2llg
Link to the Repl: https://replit.com/@codewithharry/23-Day-23-List-Methods#main.py
Join Replit the browser-based IDE used in this course - https://join.replit.com/code-with-harry-100-doc
►Checkout my English channel here: https://www.youtube.com/channel/UC7btqG2Ww0_2LwuQxpvo2HQ
►Instagram: www.instagram.com/codewithharry

python, C, C++, Java, JavaScript and Other Cheetsheets [++]:
Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agrsRZjFECeFuWY5ev2pQlk

►Learn in One Video[++]:
Python[15 Hr]: https://www.youtube.com/watch?v=gfDE2a7MKjA&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python Advance[3.5 Hr]: https://www.youtube.com/watch?v=61a7UkDO50s&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[1 Hr]: https://www.youtube.com/watch?v=qHJjMvHLJdg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[2 Hr]: https://www.youtube.com/watch?v=ihk_Xglr164&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[15 Min]:https://www.youtube.com/watch?v=fr1f84rg4Nw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JavaScript[1 Hr]: https://www.youtube.com/watch?v=onbBV0uFVpo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
C[1.3 Hr]-https://www.youtube.com/watch?v=YXcgD8hRHYY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[1 Hr]: https://www.youtube.com/watch?v=xW7ro3lwaCI&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[2.3 Hr]:https://www.youtube.com/watch?v=1SnPKhCdlsU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[Project]- https://www.youtube.com/watch?v=-al2bECumKg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
HTML[30 Min]:https://www.youtube.com/watch?v=E3ByCRqE7Lo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[8.5 Hr]:https://www.youtube.com/watch?v=Edsxf_NBFrw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[1.4 Hr]:https://www.youtube.com/watch?v=u5-K_ua9sOw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Wordpress[3.2 Hr]:https://www.youtube.com/watch?v=GlLRYml8mCY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Angular[2 Hr]:https://www.youtube.com/watch?v=0LhBvp8qpro&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Java[2.3 Hr]:https://www.youtube.com/watch?v=rV_3Lewxx6o&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Web Scraping[1 Hr]:https://www.youtube.com/watch?v=uufDGjTuq34&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
MongoDB[2 Hr]:https://www.youtube.com/watch?v=oSIv-E60NiU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Numpy[1 Hr]:https://www.youtube.com/watch?v=Rbh1rieb3zc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Android Dev[12 Hr]- https://www.youtube.com/watch?v=mXjZQX3UzOs
Linux[1 Hr]:https://www.youtube.com/watch?v=_tCY-c-sPZc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JQuery[1.1 Hr]:https://www.youtube.com/watch?v=YFlx1C8XwR0&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Git and GitHub[1.1 Hr]:https://www.youtube.com/watch?v=gwWKnnCMQ5c&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7

►Complete course [playlist]:
React: https://www.youtube.com/playlist?list=PLu0W_9lII9agx66oZnT6IyhcMIbUMNMdt
Python-https://www.youtube.com/playlist?list=PLu0W_9lII9agICnT8t4iYVSZ3eykIAOME
OOP Python-https://www.youtube.com/playlist?list=PLu0W_9lII9ahfRrhFcoB-4lpp9YaBmdCP
Java:https://www.youtube.com/playlist?list=PLu0W_9lII9agS67Uits0UnJyrYiXhDS6q
JavaScript- https://www.youtube.com/playlist?list=PLu0W_9lII9ajyk081To1Cbt2eI5913SsL
PHP-https://www.youtube.com/playlist?list=PLu0W_9lII9aikXkRE0WxDt1vozo3hnmtR
C-https://www.youtube.com/playlist?list=PLu0W_9lII9aiXlHcLx-mDH1Qul38wD3aR
C++-https://www.youtube.com/playlist?list=PLu0W_9lII9agpFUAlPFe_VNSlXW5uE0YL
Git & GitHub-https://www.youtube.com/playlist?list=PLu0W_9lII9ahVQekD7ePHmnirTePXwIln
Android Dev- https://www.youtube.com/playlist?list=PLu0W_9lII9aiL0kysYlfSOUgY5rNlOhUd
Python GUI- https://www.youtube.com/playlist?list=PLu0W_9lII9ajLcqRcj4PoEihkukF_OTzA
Web Development- https://www.youtube.com/playlist?list=PLu0W_9lII9agiCUZYRsvtGTXdxkzPyItg
Python Django:https://www.youtube.com/playlist?list=PLu0W_9lII9ah7DDtYtflgwMwpT3xmjXY9
Projects Using HTML, CSS & Javascript- https://www.youtube.com/playlist?list=PLu0W_9lII9aiQiOwthuSvinxoflmhRxM3
Data Structure and Algo:https://www.youtube.com/playlist?list=PLu0W_9lII9ahIappRPN0MCAgtOu3lQjQi 

Follow Me On Social Media
►Website (created using Django Rest & Angular): https://www.codewithharry.com
►Facebook: https://www.facebook.com/CodeWithHarry
►Instagram: https://www.instagram.com/codewithharry/ 
Twitter: https://twitter.com/CodeWithHarry
Comment "#HarryBhai" if you read this 😉😉', '572', 'cmm6gxh3g0007akrmcwd1jz2z', '22', NULL, 'https://i.ytimg.com/vi/scWc3F8LbOo/maxresdefault.jpg', 'List Methods in Python | Python Tutorial - Day #23', '2026-02-28T15:21:05.711Z', 'cmm0s6pyg0000i9evqafvt8x4', 'scWc3F8LbOo');
INSERT INTO public."Video" ("id", "createdAt", "description", "duration", "playlistId", "position", "scheduledAt", "thumbnail", "title", "updatedAt", "userId", "youtubeId") VALUES ('cmm6gxq7j001jakrmdppd1yns', '2026-02-28T15:21:06.031Z', 'Python is one of the most demanded programming languages in the job market. Surprisingly, it is equally easy to learn and master  Python. This python tutorial for absolute beginners in Hindi series will focus on teaching you python concepts from the ground up. 
Access the Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agwh1XjRt242xIpHhPT2llg
Link to the Repl: https://replit.com/@codewithharry/24-Day24-Introduction-to-Tuples#main.py
Join Replit the browser-based IDE used in this course - https://join.replit.com/code-with-harry-100-doc
►Checkout my English channel here: https://www.youtube.com/channel/UC7btqG2Ww0_2LwuQxpvo2HQ
►Instagram: www.instagram.com/codewithharry

python, C, C++, Java, JavaScript and Other Cheetsheets [++]:
Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agrsRZjFECeFuWY5ev2pQlk

►Learn in One Video[++]:
Python[15 Hr]: https://www.youtube.com/watch?v=gfDE2a7MKjA&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python Advance[3.5 Hr]: https://www.youtube.com/watch?v=61a7UkDO50s&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[1 Hr]: https://www.youtube.com/watch?v=qHJjMvHLJdg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[2 Hr]: https://www.youtube.com/watch?v=ihk_Xglr164&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[15 Min]:https://www.youtube.com/watch?v=fr1f84rg4Nw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JavaScript[1 Hr]: https://www.youtube.com/watch?v=onbBV0uFVpo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
C[1.3 Hr]-https://www.youtube.com/watch?v=YXcgD8hRHYY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[1 Hr]: https://www.youtube.com/watch?v=xW7ro3lwaCI&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[2.3 Hr]:https://www.youtube.com/watch?v=1SnPKhCdlsU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[Project]- https://www.youtube.com/watch?v=-al2bECumKg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
HTML[30 Min]:https://www.youtube.com/watch?v=E3ByCRqE7Lo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[8.5 Hr]:https://www.youtube.com/watch?v=Edsxf_NBFrw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[1.4 Hr]:https://www.youtube.com/watch?v=u5-K_ua9sOw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Wordpress[3.2 Hr]:https://www.youtube.com/watch?v=GlLRYml8mCY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Angular[2 Hr]:https://www.youtube.com/watch?v=0LhBvp8qpro&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Java[2.3 Hr]:https://www.youtube.com/watch?v=rV_3Lewxx6o&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Web Scraping[1 Hr]:https://www.youtube.com/watch?v=uufDGjTuq34&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
MongoDB[2 Hr]:https://www.youtube.com/watch?v=oSIv-E60NiU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Numpy[1 Hr]:https://www.youtube.com/watch?v=Rbh1rieb3zc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Android Dev[12 Hr]- https://www.youtube.com/watch?v=mXjZQX3UzOs
Linux[1 Hr]:https://www.youtube.com/watch?v=_tCY-c-sPZc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JQuery[1.1 Hr]:https://www.youtube.com/watch?v=YFlx1C8XwR0&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Git and GitHub[1.1 Hr]:https://www.youtube.com/watch?v=gwWKnnCMQ5c&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7

►Complete course [playlist]:
React: https://www.youtube.com/playlist?list=PLu0W_9lII9agx66oZnT6IyhcMIbUMNMdt
Python-https://www.youtube.com/playlist?list=PLu0W_9lII9agICnT8t4iYVSZ3eykIAOME
OOP Python-https://www.youtube.com/playlist?list=PLu0W_9lII9ahfRrhFcoB-4lpp9YaBmdCP
Java:https://www.youtube.com/playlist?list=PLu0W_9lII9agS67Uits0UnJyrYiXhDS6q
JavaScript- https://www.youtube.com/playlist?list=PLu0W_9lII9ajyk081To1Cbt2eI5913SsL
PHP-https://www.youtube.com/playlist?list=PLu0W_9lII9aikXkRE0WxDt1vozo3hnmtR
C-https://www.youtube.com/playlist?list=PLu0W_9lII9aiXlHcLx-mDH1Qul38wD3aR
C++-https://www.youtube.com/playlist?list=PLu0W_9lII9agpFUAlPFe_VNSlXW5uE0YL
Git & GitHub-https://www.youtube.com/playlist?list=PLu0W_9lII9ahVQekD7ePHmnirTePXwIln
Android Dev- https://www.youtube.com/playlist?list=PLu0W_9lII9aiL0kysYlfSOUgY5rNlOhUd
Python GUI- https://www.youtube.com/playlist?list=PLu0W_9lII9ajLcqRcj4PoEihkukF_OTzA
Web Development- https://www.youtube.com/playlist?list=PLu0W_9lII9agiCUZYRsvtGTXdxkzPyItg
Python Django:https://www.youtube.com/playlist?list=PLu0W_9lII9ah7DDtYtflgwMwpT3xmjXY9
Projects Using HTML, CSS & Javascript- https://www.youtube.com/playlist?list=PLu0W_9lII9aiQiOwthuSvinxoflmhRxM3
Data Structure and Algo:https://www.youtube.com/playlist?list=PLu0W_9lII9ahIappRPN0MCAgtOu3lQjQi 

Follow Me On Social Media
►Website (created using Django Rest & Angular): https://www.codewithharry.com
►Facebook: https://www.facebook.com/CodeWithHarry
►Instagram: https://www.instagram.com/codewithharry/ 
Twitter: https://twitter.com/CodeWithHarry
Comment "#HarryBhai" if you read this 😉😉', '495', 'cmm6gxh3g0007akrmcwd1jz2z', '23', NULL, 'https://i.ytimg.com/vi/PipsOUDKrVk/maxresdefault.jpg', 'Tuples in Python | Python Tutorial - Day #24', '2026-02-28T15:21:06.031Z', 'cmm0s6pyg0000i9evqafvt8x4', 'PipsOUDKrVk');
INSERT INTO public."Video" ("id", "createdAt", "description", "duration", "playlistId", "position", "scheduledAt", "thumbnail", "title", "updatedAt", "userId", "youtubeId") VALUES ('cmm6gxqg7001lakrmt4joa9ew', '2026-02-28T15:21:06.343Z', 'Python is one of the most demanded programming languages in the job market. Surprisingly, it is equally easy to learn and master  Python. This python tutorial for absolute beginners in Hindi series will focus on teaching you python concepts from the ground up. 
Access the Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agwh1XjRt242xIpHhPT2llg
Link to the Repl: https://replit.com/@codewithharry/25-Day25-Operations-on-Tuples#main.py
Join Replit the browser-based IDE used in this course - https://join.replit.com/code-with-harry-100-doc
►Checkout my English channel here: https://www.youtube.com/channel/UC7btqG2Ww0_2LwuQxpvo2HQ
►Instagram: www.instagram.com/codewithharry

python, C, C++, Java, JavaScript and Other Cheetsheets [++]:
Playlist: https://www.youtube.com/playlist?list=PLu0W_9lII9agrsRZjFECeFuWY5ev2pQlk

►Learn in One Video[++]:
Python[15 Hr]: https://www.youtube.com/watch?v=gfDE2a7MKjA&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python Advance[3.5 Hr]: https://www.youtube.com/watch?v=61a7UkDO50s&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[1 Hr]: https://www.youtube.com/watch?v=qHJjMvHLJdg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[2 Hr]: https://www.youtube.com/watch?v=ihk_Xglr164&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Python[15 Min]:https://www.youtube.com/watch?v=fr1f84rg4Nw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JavaScript[1 Hr]: https://www.youtube.com/watch?v=onbBV0uFVpo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
C[1.3 Hr]-https://www.youtube.com/watch?v=YXcgD8hRHYY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[1 Hr]: https://www.youtube.com/watch?v=xW7ro3lwaCI&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[2.3 Hr]:https://www.youtube.com/watch?v=1SnPKhCdlsU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
php[Project]- https://www.youtube.com/watch?v=-al2bECumKg&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
HTML[30 Min]:https://www.youtube.com/watch?v=E3ByCRqE7Lo&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[8.5 Hr]:https://www.youtube.com/watch?v=Edsxf_NBFrw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
CSS[1.4 Hr]:https://www.youtube.com/watch?v=u5-K_ua9sOw&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Wordpress[3.2 Hr]:https://www.youtube.com/watch?v=GlLRYml8mCY&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Angular[2 Hr]:https://www.youtube.com/watch?v=0LhBvp8qpro&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Java[2.3 Hr]:https://www.youtube.com/watch?v=rV_3Lewxx6o&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Web Scraping[1 Hr]:https://www.youtube.com/watch?v=uufDGjTuq34&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
MongoDB[2 Hr]:https://www.youtube.com/watch?v=oSIv-E60NiU&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Numpy[1 Hr]:https://www.youtube.com/watch?v=Rbh1rieb3zc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Android Dev[12 Hr]- https://www.youtube.com/watch?v=mXjZQX3UzOs
Linux[1 Hr]:https://www.youtube.com/watch?v=_tCY-c-sPZc&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
JQuery[1.1 Hr]:https://www.youtube.com/watch?v=YFlx1C8XwR0&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7
Git and GitHub[1.1 Hr]:https://www.youtube.com/watch?v=gwWKnnCMQ5c&list=PLu0W_9lII9ahKZ42vg2w9ERPmShYbYAB7

►Complete course [playlist]:
React: https://www.youtube.com/playlist?list=PLu0W_9lII9agx66oZnT6IyhcMIbUMNMdt
Python-https://www.youtube.com/playlist?list=PLu0W_9lII9agICnT8t4iYVSZ3eykIAOME
OOP Python-https://www.youtube.com/playlist?list=PLu0W_9lII9ahfRrhFcoB-4lpp9YaBmdCP
Java:https://www.youtube.com/playlist?list=PLu0W_9lII9agS67Uits0UnJyrYiXhDS6q
JavaScript- https://www.youtube.com/playlist?list=PLu0W_9lII9ajyk081To1Cbt2eI5913SsL
PHP-https://www.youtube.com/playlist?list=PLu0W_9lII9aikXkRE0WxDt1vozo3hnmtR
C-https://www.youtube.com/playlist?list=PLu0W_9lII9aiXlHcLx-mDH1Qul38wD3aR
C++-https://www.youtube.com/playlist?list=PLu0W_9lII9agpFUAlPFe_VNSlXW5uE0YL
Git & GitHub-https://www.youtube.com/playlist?list=PLu0W_9lII9ahVQekD7ePHmnirTePXwIln
Android Dev- https://www.youtube.com/playlist?list=PLu0W_9lII9aiL0kysYlfSOUgY5rNlOhUd
Python GUI- https://www.youtube.com/playlist?list=PLu0W_9lII9ajLcqRcj4PoEihkukF_OTzA
Web Development- https://www.youtube.com/playlist?list=PLu0W_9lII9agiCUZYRsvtGTXdxkzPyItg
Python Django:https://www.youtube.com/playlist?list=PLu0W_9lII9ah7DDtYtflgwMwpT3xmjXY9
Projects Using HTML, CSS & Javascript- https://www.youtube.com/playlist?list=PLu0W_9lII9aiQiOwthuSvinxoflmhRxM3
Data Structure and Algo:https://www.youtube.com/playlist?list=PLu0W_9lII9ahIappRPN0MCAgtOu3lQjQi 

Follow Me On Social Media
►Website (created using Django Rest & Angular): https://www.codewithharry.com
►Facebook: https://www.facebook.com/CodeWithHarry
►Instagram: https://www.instagram.com/codewithharry/ 
Twitter: https://twitter.com/CodeWithHarry
Comment "#HarryBhai" if you read this 😉😉', '419', 'cmm6gxh3g0007akrmcwd1jz2z', '24', NULL, 'https://i.ytimg.com/vi/XblLSduioJI/maxresdefault.jpg', 'Operations on Tuples in Python | Python Tutorial - Day #25', '2026-02-28T15:21:06.343Z', 'cmm0s6pyg0000i9evqafvt8x4', 'XblLSduioJI');

-- UserSettings: 3 row(s)
INSERT INTO public."UserSettings" ("id", "autoPlayNext", "createdAt", "defaultPlaybackSpeed", "eyeTrackingEnabled", "eyeTrackingThreshold", "inactivityTimeout", "onboardingCompleted", "sensitivityMode", "soundAlerts", "theme", "updatedAt", "userId", "weeklyGoal") VALUES ('cmm3e88yp00048zuho1r7awvw', true, '2026-02-26T11:41:59.522Z', '1', true, '0', '100', true, 'light', false, 'dark', '2026-03-18T16:10:49.514Z', 'cmm0s6pyg0000i9evqafvt8x4', '30');
INSERT INTO public."UserSettings" ("id", "autoPlayNext", "createdAt", "defaultPlaybackSpeed", "eyeTrackingEnabled", "eyeTrackingThreshold", "inactivityTimeout", "onboardingCompleted", "sensitivityMode", "soundAlerts", "theme", "updatedAt", "userId", "weeklyGoal") VALUES ('cmmjbv4f00002w0v0kjpqgpmp', true, '2026-03-09T15:20:06.684Z', '1', true, '0', '30', true, 'moderate', false, 'dark', '2026-03-12T16:58:07.476Z', 'cmmjbv3x90000w0v0xul8jess', '10');
INSERT INTO public."UserSettings" ("id", "autoPlayNext", "createdAt", "defaultPlaybackSpeed", "eyeTrackingEnabled", "eyeTrackingThreshold", "inactivityTimeout", "onboardingCompleted", "sensitivityMode", "soundAlerts", "theme", "updatedAt", "userId", "weeklyGoal") VALUES ('cmmnpm00a0002wujldhewndiq', true, '2026-03-12T16:56:00.394Z', '1', true, '0', '30', true, 'moderate', true, 'dark', '2026-03-12T17:08:46.340Z', 'cmmnplzzp0000wujl0o5100qy', '10');

-- SiteSettings: 1 row(s)
INSERT INTO public."SiteSettings" ("id", "signupEnabled", "updatedAt") VALUES ('global', true, '2026-03-09T16:05:38.489Z');

-- Notification: 1 row(s)
INSERT INTO public."Notification" ("id", "createdAt", "global", "message", "read", "title", "userId") VALUES ('cmmnqgifo0031kx6s7ygsd2kf', '2026-03-12T17:19:43.957Z', false, 'JUST REFRESH THE PAGE', false, 'ANY ISSUES', 'cmmnplzzp0000wujl0o5100qy');

-- VideoProgress: 25 row(s)
INSERT INTO public."VideoProgress" ("id", "completed", "completedAt", "createdAt", "durationSeconds", "secondsWatched", "updatedAt", "userId", "youtubeId") VALUES ('cmm3ghj9x0033q53hiirlwjcp', false, NULL, '2026-02-26T12:45:11.685Z', '214', '82', '2026-03-12T17:25:06.745Z', 'cmm0s6pyg0000i9evqafvt8x4', 'dQw4w9WgXcQ');
INSERT INTO public."VideoProgress" ("id", "completed", "completedAt", "createdAt", "durationSeconds", "secondsWatched", "updatedAt", "userId", "youtubeId") VALUES ('cmm3gqwn700opq53hbp3ij5px', true, '2026-03-01T17:23:21.105Z', '2026-02-26T12:52:29.251Z', '1880', '0', '2026-03-01T17:23:21.112Z', 'cmm0s6pyg0000i9evqafvt8x4', 'tVzUXW6siu0');
INSERT INTO public."VideoProgress" ("id", "completed", "completedAt", "createdAt", "durationSeconds", "secondsWatched", "updatedAt", "userId", "youtubeId") VALUES ('cmm3hieee0115q53hoptjlj5x', true, '2026-03-01T17:23:16.955Z', '2026-02-26T13:13:51.974Z', '1711', '0', '2026-03-01T17:23:16.958Z', 'cmm0s6pyg0000i9evqafvt8x4', 'kJEsTjH5mVg');
INSERT INTO public."VideoProgress" ("id", "completed", "completedAt", "createdAt", "durationSeconds", "secondsWatched", "updatedAt", "userId", "youtubeId") VALUES ('cmm3jf9u901bzq53ha8dv6yyo', false, NULL, '2026-02-26T14:07:25.329Z', '19003', '0', '2026-02-26T14:07:28.357Z', 'cmm0s6pyg0000i9evqafvt8x4', 'xN7trkC-J8c');
INSERT INTO public."VideoProgress" ("id", "completed", "completedAt", "createdAt", "durationSeconds", "secondsWatched", "updatedAt", "userId", "youtubeId") VALUES ('cmm3klkxe01qfq53hc7qizma4', false, NULL, '2026-02-26T14:40:19.250Z', '11472', '0', '2026-02-26T15:24:21.170Z', 'cmm0s6pyg0000i9evqafvt8x4', 'BsDoLVMnmZs');
INSERT INTO public."VideoProgress" ("id", "completed", "completedAt", "createdAt", "durationSeconds", "secondsWatched", "updatedAt", "userId", "youtubeId") VALUES ('cmm6k64hu000314jzua8k90sn', true, '2026-03-02T16:56:05.710Z', '2026-02-28T16:51:36.636Z', NULL, '0', '2026-03-02T16:56:05.714Z', 'cmm0s6pyg0000i9evqafvt8x4', '7wnove7K-ZQ');
INSERT INTO public."VideoProgress" ("id", "completed", "completedAt", "createdAt", "durationSeconds", "secondsWatched", "updatedAt", "userId", "youtubeId") VALUES ('cmm80qv07008bdzkxsriidgfz', true, '2026-03-01T17:23:24.147Z', '2026-03-01T17:23:24.149Z', NULL, '0', '2026-03-01T17:23:24.149Z', 'cmm0s6pyg0000i9evqafvt8x4', 'BGeDBfCIqas');
INSERT INTO public."VideoProgress" ("id", "completed", "completedAt", "createdAt", "durationSeconds", "secondsWatched", "updatedAt", "userId", "youtubeId") VALUES ('cmm80qwuq008ddzkxij3kegon', true, '2026-03-01T17:23:26.541Z', '2026-03-01T17:23:26.546Z', NULL, '0', '2026-03-01T17:23:26.546Z', 'cmm0s6pyg0000i9evqafvt8x4', 'nXba2-mgn1k');
INSERT INTO public."VideoProgress" ("id", "completed", "completedAt", "createdAt", "durationSeconds", "secondsWatched", "updatedAt", "userId", "youtubeId") VALUES ('cmm80r2hs008fdzkxe6cria2p', true, '2026-03-01T17:23:33.468Z', '2026-03-01T17:23:33.471Z', NULL, '0', '2026-03-01T17:23:33.471Z', 'cmm0s6pyg0000i9evqafvt8x4', '1BsVhumGlNc');
INSERT INTO public."VideoProgress" ("id", "completed", "completedAt", "createdAt", "durationSeconds", "secondsWatched", "updatedAt", "userId", "youtubeId") VALUES ('cmm80r3mr008hdzkx8to6qhp7', true, '2026-03-01T17:23:35.329Z', '2026-03-01T17:23:35.331Z', NULL, '0', '2026-03-01T17:23:35.331Z', 'cmm0s6pyg0000i9evqafvt8x4', 'CyRlWlaJnTY');
INSERT INTO public."VideoProgress" ("id", "completed", "completedAt", "createdAt", "durationSeconds", "secondsWatched", "updatedAt", "userId", "youtubeId") VALUES ('cmm80r4sp008jdzkxzycgl6uv', true, '2026-03-01T17:23:36.839Z', '2026-03-01T17:23:36.841Z', NULL, '0', '2026-03-01T17:23:36.841Z', 'cmm0s6pyg0000i9evqafvt8x4', 'tLBlhp0SA_0');
INSERT INTO public."VideoProgress" ("id", "completed", "completedAt", "createdAt", "durationSeconds", "secondsWatched", "updatedAt", "userId", "youtubeId") VALUES ('cmm80r7vv008ldzkxugt7hzrv', true, '2026-03-01T17:23:40.840Z', '2026-03-01T17:23:40.843Z', NULL, '0', '2026-03-01T17:23:40.843Z', 'cmm0s6pyg0000i9evqafvt8x4', 'vnnlUCLfn6I');
INSERT INTO public."VideoProgress" ("id", "completed", "completedAt", "createdAt", "durationSeconds", "secondsWatched", "updatedAt", "userId", "youtubeId") VALUES ('cmm80r93m008ndzkx8v1jty3d', true, '2026-03-01T17:23:42.413Z', '2026-03-01T17:23:42.418Z', NULL, '0', '2026-03-01T17:23:42.418Z', 'cmm0s6pyg0000i9evqafvt8x4', 'vlAWzsGd-Yk');
INSERT INTO public."VideoProgress" ("id", "completed", "completedAt", "createdAt", "durationSeconds", "secondsWatched", "updatedAt", "userId", "youtubeId") VALUES ('cmm9f7o4f000ll01g624mn8cz', true, '2026-03-02T16:56:09.178Z', '2026-03-02T16:56:09.183Z', NULL, '0', '2026-03-02T16:56:09.183Z', 'cmm0s6pyg0000i9evqafvt8x4', 'Tto8TS-fJQU');
INSERT INTO public."VideoProgress" ("id", "completed", "completedAt", "createdAt", "durationSeconds", "secondsWatched", "updatedAt", "userId", "youtubeId") VALUES ('cmm9f7p83000nl01gv0k8sb1i', true, '2026-03-02T16:56:10.607Z', '2026-03-02T16:56:10.611Z', NULL, '0', '2026-03-02T16:56:10.611Z', 'cmm0s6pyg0000i9evqafvt8x4', 'xwKO_y2gHxQ');
INSERT INTO public."VideoProgress" ("id", "completed", "completedAt", "createdAt", "durationSeconds", "secondsWatched", "updatedAt", "userId", "youtubeId") VALUES ('cmm9f7qsc000pl01ghatgx7yg', true, '2026-03-02T16:56:12.633Z', '2026-03-02T16:56:12.636Z', NULL, '0', '2026-03-02T16:56:12.636Z', 'cmm0s6pyg0000i9evqafvt8x4', '7IWOYhfAcVg');
INSERT INTO public."VideoProgress" ("id", "completed", "completedAt", "createdAt", "durationSeconds", "secondsWatched", "updatedAt", "userId", "youtubeId") VALUES ('cmm9f82xg000rl01gw0uwnvpy', true, '2026-03-02T16:56:28.358Z', '2026-03-02T16:56:28.372Z', NULL, '0', '2026-03-02T16:56:28.372Z', 'cmm0s6pyg0000i9evqafvt8x4', 'qxPMmW93eDs');
INSERT INTO public."VideoProgress" ("id", "completed", "completedAt", "createdAt", "durationSeconds", "secondsWatched", "updatedAt", "userId", "youtubeId") VALUES ('cmm9f84at000tl01gj23tdk24', true, '2026-03-02T16:56:30.146Z', '2026-03-02T16:56:30.149Z', NULL, '0', '2026-03-02T16:56:30.149Z', 'cmm0s6pyg0000i9evqafvt8x4', 'ORCuz7s5cCY');
INSERT INTO public."VideoProgress" ("id", "completed", "completedAt", "createdAt", "durationSeconds", "secondsWatched", "updatedAt", "userId", "youtubeId") VALUES ('cmm9f865u000vl01g7wp6zoq5', true, '2026-03-02T16:56:32.559Z', '2026-03-02T16:56:32.562Z', NULL, '0', '2026-03-02T16:56:32.562Z', 'cmm0s6pyg0000i9evqafvt8x4', 'FLVqcxnJP_E');
INSERT INTO public."VideoProgress" ("id", "completed", "completedAt", "createdAt", "durationSeconds", "secondsWatched", "updatedAt", "userId", "youtubeId") VALUES ('cmm9f87uq000xl01g74r2txs5', true, '2026-03-02T16:56:34.752Z', '2026-03-02T16:56:34.755Z', NULL, '0', '2026-03-02T16:56:34.755Z', 'cmm0s6pyg0000i9evqafvt8x4', 'dohaSBCKCr0');
INSERT INTO public."VideoProgress" ("id", "completed", "completedAt", "createdAt", "durationSeconds", "secondsWatched", "updatedAt", "userId", "youtubeId") VALUES ('cmm9f8jrx000zl01gciytlfii', true, '2026-03-02T16:56:49.882Z', '2026-03-02T16:56:49.884Z', NULL, '0', '2026-03-02T16:56:49.884Z', 'cmm0s6pyg0000i9evqafvt8x4', 'Pu5bqySSSS0');
INSERT INTO public."VideoProgress" ("id", "completed", "completedAt", "createdAt", "durationSeconds", "secondsWatched", "updatedAt", "userId", "youtubeId") VALUES ('cmm9f8l6b0011l01gm5ftgg7x', true, '2026-03-02T16:56:52.017Z', '2026-03-02T16:56:52.019Z', NULL, '0', '2026-03-02T16:56:52.019Z', 'cmm0s6pyg0000i9evqafvt8x4', 'WvG-R-xXouA');
INSERT INTO public."VideoProgress" ("id", "completed", "completedAt", "createdAt", "durationSeconds", "secondsWatched", "updatedAt", "userId", "youtubeId") VALUES ('cmmdbhu5x0001btx0159dnjjz', false, NULL, '2026-03-05T10:23:09.811Z', '8990', '23', '2026-03-18T16:27:57.367Z', 'cmm0s6pyg0000i9evqafvt8x4', '1g32IlH3SUs');
INSERT INTO public."VideoProgress" ("id", "completed", "completedAt", "createdAt", "durationSeconds", "secondsWatched", "updatedAt", "userId", "youtubeId") VALUES ('cmmnq11x40003emmcoam9obb2', false, NULL, '2026-03-12T17:07:42.712Z', '214', '0', '2026-03-13T07:09:04.017Z', 'cmmjbv3x90000w0v0xul8jess', 'dQw4w9WgXcQ');
INSERT INTO public."VideoProgress" ("id", "completed", "completedAt", "createdAt", "durationSeconds", "secondsWatched", "updatedAt", "userId", "youtubeId") VALUES ('cmmnq3rqi0001kx6sjh1bxfxt', false, NULL, '2026-03-12T17:09:49.482Z', '214', '38', '2026-03-12T17:32:36.409Z', 'cmmnplzzp0000wujl0o5100qy', 'dQw4w9WgXcQ');

-- _prisma_migrations: 2 row(s)
INSERT INTO public."_prisma_migrations" ("id", "applied_steps_count", "checksum", "finished_at", "logs", "migration_name", "rolled_back_at", "started_at") VALUES ('9f38c6fa-de99-411e-9810-3d728e1c98f3', '1', 'e484c4c5896dd1dc4aeaad10b332be9c84c36c80f557bb1400aa3a13db200342', '2026-02-24T14:07:18.200Z', NULL, '20260224140715_add_description_to_folder', NULL, '2026-02-24T14:07:16.678Z');
INSERT INTO public."_prisma_migrations" ("id", "applied_steps_count", "checksum", "finished_at", "logs", "migration_name", "rolled_back_at", "started_at") VALUES ('d42988f5-a6e3-4561-a84a-852765453eb3', '1', '16443a4c33b2710d1a18f95f06e74ef623227c2f0de05df5744db4ae78956491', '2026-02-24T07:38:47.277Z', NULL, '20260224073843_init', NULL, '2026-02-24T07:38:45.334Z');

COMMIT;