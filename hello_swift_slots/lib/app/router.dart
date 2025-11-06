import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../features/auth/auth_providers.dart';
import '../features/auth/profile_screen.dart';
import '../features/auth/sign_in_screen.dart';
import '../features/booking/checkout_screen.dart';
import '../features/feed/feed_screen.dart';
import '../features/feed/slot_model.dart';
import '../features/slot_detail/slot_detail_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateChangesProvider);
  final isLoading = authState.isLoading || authState.isRefreshing;
  final isLoggedIn = authState.maybeWhen(
    data: (user) => user != null,
    orElse: () => false,
  );

  return GoRouter(
    initialLocation: '/feed',
    redirect: (context, state) {
      if (isLoading) {
        return null;
      }

      final path = state.uri.path;
      final loggingIn = path == '/sign-in';

      if (!isLoggedIn && !loggingIn) {
        return '/sign-in';
      }

      if (isLoggedIn && loggingIn) {
        return '/feed';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/sign-in',
        name: SignInScreen.routeName,
        builder: (context, state) => const SignInScreen(),
      ),
      GoRoute(
        path: '/feed',
        name: FeedScreen.routeName,
        builder: (context, state) => const FeedScreen(),
      ),
      GoRoute(
        path: '/slot/:id',
        name: SlotDetailScreen.routeName,
        builder: (context, state) {
          final slotId = state.pathParameters['id']!;
          final slot = state.extra is Slot ? state.extra as Slot : null;
          return SlotDetailScreen(slotId: slotId, initialSlot: slot);
        },
      ),
      GoRoute(
        path: '/checkout',
        name: CheckoutScreen.routeName,
        builder: (context, state) {
          final slot = state.extra is Slot ? state.extra as Slot : null;
          return CheckoutScreen(slot: slot);
        },
      ),
      GoRoute(
        path: '/profile',
        name: ProfileScreen.routeName,
        builder: (context, state) => const ProfileScreen(),
      ),
    ],
  );
});
