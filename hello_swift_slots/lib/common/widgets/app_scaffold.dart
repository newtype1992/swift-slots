import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import '../../dev/dev_menu.dart';

class AppScaffold extends StatelessWidget {
  const AppScaffold({
    super.key,
    required this.title,
    required this.body,
    this.actions,
    this.floatingActionButton,
  });

  final String title;
  final Widget body;
  final List<Widget>? actions;
  final Widget? floatingActionButton;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        actions: [
          ...?actions,
          if (kDebugMode)
            IconButton(
              tooltip: 'Dev Menu',
              icon: const Icon(Icons.bug_report_outlined),
              onPressed: () => DevMenu.show(context),
            ),
        ],
      ),
      floatingActionButton: floatingActionButton,
      body: SafeArea(child: body),
    );
  }
}
