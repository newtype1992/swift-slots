import 'package:flutter/material.dart';

class EnvDebugView extends StatelessWidget {
  const EnvDebugView({super.key});

  @override
  Widget build(BuildContext context) {
    const firebaseProjectId =
        String.fromEnvironment('FIREBASE_PROJECT_ID', defaultValue: 'unknown');
    const apiBaseUrl =
        String.fromEnvironment('API_BASE_URL', defaultValue: 'unknown');

    return Scaffold(
      appBar: AppBar(title: const Text('Environment Debug')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Current dart-define values:',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            const SizedBox(height: 16),
            Text('FIREBASE_PROJECT_ID: $firebaseProjectId'),
            Text('API_BASE_URL: $apiBaseUrl'),
            const SizedBox(height: 24),
            const Text(
              'Note: These values are injected via .env (local) or GitHub Variables (CI).',
              style: TextStyle(color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }
}
