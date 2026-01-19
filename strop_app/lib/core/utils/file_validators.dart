import 'dart:io';

class FileValidators {
  // Max size per image in bytes (5 MB)
  static const int maxImageBytes = 5 * 1024 * 1024;

  // Allowed image extensions (lowercase, without dot)
  static const List<String> allowedImageExtensions = [
    'jpg',
    'jpeg',
    'png',
    'webp',
  ];

  /// Validates an image file. Returns null when valid, otherwise returns
  /// a human-friendly error message.
  static Future<String?> validateImageFile(File file) async {
    try {
      if (!await file.exists()) return 'Archivo no encontrado';

      final size = await file.length();
      if (size > maxImageBytes) {
        return 'La imagen supera el tamaño máximo de ${maxImageBytes ~/ (1024 * 1024)} MB';
      }

      final name = file.path.split('/').last.split(r'\').last;
      final parts = name.split('.');
      if (parts.length < 2) return 'Tipo de archivo no reconocido';
      final ext = parts.last.toLowerCase();
      if (!allowedImageExtensions.contains(ext)) {
        return 'Tipo no permitido. Usa: ${allowedImageExtensions.join(', ')}';
      }

      return null;
    } catch (e) {
      return 'Error al validar el archivo';
    }
  }
}
