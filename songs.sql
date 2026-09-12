-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1:3306
-- Tiempo de generación: 01-03-2026 a las 02:16:27
-- Versión del servidor: 11.8.3-MariaDB-log
-- Versión de PHP: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `u803496046_pianomagicoweb`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `songs`
--

CREATE TABLE `songs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `sequence` text NOT NULL,
  `sticker_id` int(11) DEFAULT 1,
  `speed` int(11) DEFAULT 800,
  `rhythm` varchar(50) DEFAULT 'pop',
  `is_user_created` tinyint(1) DEFAULT 0,
  `order_index` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `songs`
--

INSERT INTO `songs` (`id`, `user_id`, `title`, `sequence`, `sticker_id`, `speed`, `rhythm`, `is_user_created`) VALUES
(1, NULL, '1. El Saludo del Elefante', '[\"C\",\"C\",\"C\"]', 1, 1300, 'bubble', 0),
(2, NULL, '2. Subiendo la Escalera', '[\"C\",\"D\",\"E\"]', 2, 1250, 'bubble', 0),
(3, NULL, '3. Bajando la Escalera', '[\"E\",\"D\",\"C\"]', 3, 1250, 'bubble', 0),
(4, NULL, '4. El Tren se detiene', '[\"C\",\"C\",\"D\",\"D\",\"C\"]', 4, 1200, 'bubble', 0),
(5, NULL, '5. Saltitos de Rana (C-E)', '[\"C\",\"E\",\"C\",\"E\"]', 12, 1200, 'bubble', 0),
(6, NULL, '6. Campanitas (Parte 1)', '[\"E\",\"D\",\"C\",\"D\"]', 13, 1100, 'pop', 0),
(7, NULL, '7. Campanitas (Final)', '[\"E\",\"E\",\"E\"]', 13, 1100, 'pop', 0),
(8, NULL, '8. Campanitas Completo', '[\"E\",\"D\",\"C\",\"D\",\"E\",\"E\",\"E\"]', 4, 1100, 'pop', 0),
(9, NULL, '9. El Gatito Curioso', '[\"C\",\"D\",\"E\",\"F\",\"G\"]', 2, 1050, 'bubble', 0),
(10, NULL, '10. Tobogán Largo', '[\"G\",\"F\",\"E\",\"D\",\"C\"]', 15, 1050, 'bubble', 0),
(11, NULL, '11. Pin Pon (El Lavado)', '[\"G\",\"E\",\"E\",\"F\",\"D\",\"D\"]', 5, 1000, 'pop', 0),
(12, NULL, '12. Pin Pon (Final)', '[\"C\",\"E\",\"G\",\"G\"]', 5, 1000, 'pop', 0),
(13, NULL, '13. Pin Pon Completo', '[\"G\",\"E\",\"E\",\"F\",\"D\",\"D\",\"C\",\"E\",\"G\"]', 5, 950, 'pop', 0),
(14, NULL, '14. Un Elefante (La Red)', '[\"C\",\"C\",\"D\",\"C\",\"E\",\"C\"]', 6, 950, 'pop', 0),
(15, NULL, '15. Un Elefante Completo', '[\"C\",\"C\",\"D\",\"C\",\"E\",\"C\",\"F\",\"E\",\"D\"]', 6, 900, 'pop', 0),
(16, NULL, '16. Los Pollitos (El Coro)', '[\"C\",\"D\",\"E\",\"F\",\"G\",\"G\"]', 7, 900, 'pop', 0),
(17, NULL, '17. Los Pollitos (Pío Pío)', '[\"A\",\"A\",\"A\",\"A\",\"G\"]', 7, 900, 'pop', 0),
(18, NULL, '18. Los Pollitos Completo', '[\"C\",\"D\",\"E\",\"F\",\"G\",\"G\",\"A\",\"A\",\"A\",\"A\",\"G\"]', 7, 850, 'pop', 0),
(19, NULL, '19. Estrellita (El Cielo)', '[\"C\",\"C\",\"G\",\"G\",\"A\",\"A\",\"G\"]', 10, 900, 'pop', 0),
(20, NULL, '20. Estrellita (El Camino)', '[\"F\",\"F\",\"E\",\"E\",\"D\",\"D\",\"C\"]', 10, 900, 'pop', 0),
(21, NULL, '21. Estrellita (El Brillo)', '[\"G\",\"G\",\"F\",\"F\",\"E\",\"E\",\"D\"]', 10, 900, 'pop', 0),
(22, NULL, '22. Estrellita COMPLETA', '[\"C\",\"C\",\"G\",\"G\",\"A\",\"A\",\"G\",\"F\",\"F\",\"E\",\"E\",\"D\",\"D\",\"C\"]', 10, 850, 'pop', 0),
(23, NULL, '23. La Vaca Lola (Inicio)', '[\"C\",\"C\",\"G\",\"G\",\"A\",\"A\",\"G\"]', 9, 850, 'pop', 0),
(24, NULL, '24. La Vaca Lola Completa', '[\"C\",\"C\",\"G\",\"G\",\"A\",\"A\",\"G\",\"F\",\"F\",\"E\",\"E\",\"D\",\"D\",\"C\"]', 9, 800, 'pop', 0),
(25, NULL, '25. En la Granja (IEIAO)', '[\"G\",\"G\",\"G\",\"D\",\"E\",\"E\",\"D\"]', 8, 850, 'pop', 0),
(26, NULL, '26. En la Granja Completo', '[\"G\",\"G\",\"G\",\"D\",\"E\",\"E\",\"D\",\"B\",\"B\",\"A\",\"A\",\"G\"]', 8, 850, 'pop', 0),
(27, NULL, '27. Baby Shark (Ataque)', '[\"D\",\"E\",\"G\",\"G\",\"G\",\"G\",\"G\",\"G\",\"G\"]', 11, 700, 'rock', 0),
(28, NULL, '28. Baby Shark Completo', '[\"D\",\"E\",\"G\",\"G\",\"G\",\"G\",\"G\",\"G\",\"G\",\"D\",\"E\",\"G\"]', 11, 650, 'rock', 0),
(29, NULL, '29. Autobús (Ruedas)', '[\"C\",\"F\",\"F\",\"F\",\"F\",\"A\",\"C\"]', 12, 850, 'pop', 0),
(30, NULL, '30. Autobús Completo', '[\"C\",\"F\",\"F\",\"F\",\"F\",\"A\",\"C\",\"A\",\"F\",\"G\",\"E\",\"C\"]', 12, 800, 'pop', 0),
(31, NULL, '31. Feliz Cumple (Deseo)', '[\"C\",\"C\",\"D\",\"C\",\"F\",\"E\"]', 13, 900, 'pop', 0),
(32, NULL, '32. Feliz Cumple Completo', '[\"C\",\"C\",\"D\",\"C\",\"F\",\"E\",\"C\",\"C\",\"D\",\"C\",\"G\",\"F\"]', 13, 850, 'pop', 0),
(33, NULL, '33. Sunshine (Luz)', '[\"C\",\"F\",\"G\",\"A\",\"A\",\"A\"]', 14, 900, 'pop', 0),
(34, NULL, '34. Sunshine Completo', '[\"C\",\"F\",\"G\",\"A\",\"A\",\"A\",\"G\",\"A\",\"F\",\"F\"]', 14, 850, 'pop', 0),
(35, NULL, '35. Himno a la Alegría', '[\"E\",\"E\",\"F\",\"G\",\"G\",\"F\",\"E\",\"D\",\"C\",\"C\",\"D\",\"E\",\"E\",\"D\",\"D\"]', 20, 950, 'march', 0),
(36, NULL, '36. Amigo Fiel (Toy Story)', '[\"C\",\"E\",\"G\",\"A\",\"G\",\"E\",\"C\",\"D\",\"E\",\"D\",\"C\"]', 3, 800, 'pop', 0),
(37, NULL, '37. El Invierno (Vivaldi)', '[\"F\",\"F\",\"F\",\"F\",\"F\",\"F\",\"F\",\"F\",\"G\",\"F\",\"E\",\"D\",\"C\"]', 20, 750, 'rock', 0),
(38, NULL, '38. Osito Gominola', '[\"C\",\"C\",\"D\",\"D\",\"E\",\"E\",\"F\",\"G\",\"A\",\"B\",\"C\",\"G\",\"E\",\"C\"]', 15, 700, 'rock', 0),
(39, NULL, '39. Escala de Blues (Pro)', '[\"C\",\"D\",\"E\",\"G\",\"A\",\"A\",\"G\",\"E\",\"D\",\"C\"]', 4, 650, 'rock', 0),
(40, NULL, '40. El Gran Concierto Final', '[\"C\",\"D\",\"E\",\"F\",\"G\",\"A\",\"B\",\"C\",\"B\",\"A\",\"G\",\"F\",\"E\",\"D\",\"C\"]', 20, 600, 'pop', 0);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `songs`
--
ALTER TABLE `songs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `songs`
--
ALTER TABLE `songs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `songs`
--
ALTER TABLE `songs`
  ADD CONSTRAINT `songs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
