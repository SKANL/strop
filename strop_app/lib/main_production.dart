import 'package:strop_app/app/view/app.dart';
import 'package:strop_app/bootstrap.dart';

Future<void> main() async {
  await bootstrap(() => const App());
}
