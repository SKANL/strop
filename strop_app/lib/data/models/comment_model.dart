import 'package:strop_app/domain/entities/entities.dart';

class CommentModel extends Comment {
  const CommentModel({
    required super.id,
    required super.incidentId,
    required super.text,
    super.authorId,
    super.author,
    super.createdAt,
  });

  factory CommentModel.fromJson(Map<String, dynamic> json) {
    final authorName = json['author_name'] as String?;
    final authorAvatar = json['author_avatar'] as String?;

    User? author;
    if (authorName != null) {
      author = User(
        id: json['author_id'] as String? ?? '',
        currentOrganizationId: '',
        email: '',
        fullName: authorName,
        profilePictureUrl: authorAvatar,
        authId: '',
      );
    } else if (json['author'] is Map<String, dynamic>) {
      // Optional: implement logic if author comes as object
    }

    return CommentModel(
      id: json['id'] as String,
      incidentId: json['incident_id'] as String? ?? '',
      text: json['text'] as String,
      authorId: json['author_id'] as String?,
      author: author,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : null,
    );
  }
}
