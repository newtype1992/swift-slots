import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import 'env_debug.dart';
import 'seed.dart';

class DevMenu extends StatefulWidget {
  const DevMenu({super.key});

  static void show(BuildContext context) {
    if (!kDebugMode) {
      return;
    }

    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (context) => const DevMenu(),
    );
  }

  @override
  State<DevMenu> createState() => _DevMenuState();
}

class _DevMenuState extends State<DevMenu> {
  bool _isSeeding = false;

  Future<void> _handleSeed() async {
    if (_isSeeding) {
      return;
    }
    setState(() => _isSeeding = true);
    final messenger = ScaffoldMessenger.of(context);

    try {
      await seedSlots(FirebaseFirestore.instance);
      messenger.showSnackBar(
        const SnackBar(content: Text('Seeded 10 open slots successfully.')),
      );
    } catch (error) {
      messenger.showSnackBar(
        SnackBar(content: Text('Failed to seed slots: $error')),
      );
    } finally {
      if (mounted) {
        setState(() => _isSeeding = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!kDebugMode) {
      return const SizedBox.shrink();
    }

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Developer Tools',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: _isSeeding ? null : _handleSeed,
              icon: _isSeeding
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.cloud_upload_outlined),
              label: const Text('Seed Firestore (10 slots)'),
            ),
            const SizedBox(height: 12),
            const Text(
              'Seeds 10 open slots with realistic sample data. Use only in debug.',
            ),
            const SizedBox(height: 24),
            OutlinedButton.icon(
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => const EnvDebugView(),
                  ),
                );
              },
              icon: const Icon(Icons.bug_report),
              label: const Text('View Env Debug'),
            ),
          ],
        ),
      ),
    );
  }
}
