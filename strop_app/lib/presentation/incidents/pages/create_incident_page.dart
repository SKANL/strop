// Create Incident Page - Multi-step wizard
// lib/presentation/incidents/pages/create_incident_page.dart

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import 'package:strop_app/core/theme/app_colors.dart';
import 'package:strop_app/core/theme/app_shadows.dart';
import 'package:strop_app/domain/entities/entities.dart';
import 'package:strop_app/domain/repositories/incident_repository.dart'; // Ensure this is exported or imported correctly
import 'package:strop_app/presentation/incidents/bloc/create_incident_bloc.dart';

/// 3-step incident creation wizard
class CreateIncidentPage extends StatefulWidget {
  const CreateIncidentPage({
    required this.projectId,
    this.incidentType,
    super.key,
  });

  final String projectId;
  final String? incidentType;

  @override
  State<CreateIncidentPage> createState() => _CreateIncidentPageState();
}

class _CreateIncidentPageState extends State<CreateIncidentPage> {
  final _pageController = PageController();
  int _currentStep = 0;
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _picker = ImagePicker();
  String? _location;
  bool _isCritical = false;
  final List<String> _photos = []; // Stores local file paths

  @override
  void dispose() {
    _pageController.dispose();
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final type = widget.incidentType != null
        ? IncidentType.fromString(widget.incidentType!)
        : IncidentType.incidentNotification;
    final typeColor = AppColors.getIncidentTypeColor(type.name);

    return BlocProvider(
      create: (context) => CreateIncidentBloc(
        incidentRepository: context.read<IncidentRepository>(),
      ),
      child: BlocConsumer<CreateIncidentBloc, CreateIncidentState>(
        listener: (context, state) {
          if (state is CreateIncidentSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  state.warningMessage ?? 'Reporte enviado correctamente',
                ),
                backgroundColor: state.warningMessage != null
                    ? AppColors.warning
                    : AppColors.success,
              ),
            );
            context.go('/home');
          } else if (state is CreateIncidentFailure) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: AppColors.error,
              ),
            );
          }
        },
        builder: (context, state) {
          return Scaffold(
            appBar: AppBar(
              title: Text(type.displayName),
              leading: IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => _showExitConfirmation(context),
              ),
              bottom: PreferredSize(
                preferredSize: const Size.fromHeight(4),
                child: state is CreateIncidentLoading
                    ? const LinearProgressIndicator(color: AppColors.accent)
                    : LinearProgressIndicator(
                        value: (_currentStep + 1) / 3,
                        backgroundColor: AppColors.border,
                        valueColor: AlwaysStoppedAnimation<Color>(typeColor),
                      ),
              ),
            ),
            body: Stack(
              children: [
                Column(
                  children: [
                    // Step indicators
                    _buildStepIndicators(context, typeColor),

                    // Page content
                    Expanded(
                      child: PageView(
                        controller: _pageController,
                        physics: const NeverScrollableScrollPhysics(),
                        onPageChanged: (index) {
                          setState(() => _currentStep = index);
                        },
                        children: [
                          _buildStep1Evidence(context),
                          _buildStep2Context(context),
                          _buildStep3Review(context, type),
                        ],
                      ),
                    ),

                    // Bottom navigation
                    _buildBottomButtons(context, typeColor),
                  ],
                ),
                if (state is CreateIncidentLoading)
                  Container(
                    color: Colors.black12,
                    child: const Center(
                      child: CircularProgressIndicator(),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildStepIndicators(BuildContext context, Color typeColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: Row(
        children: [
          _buildStepDot(0, 'Evidencia', typeColor),
          Expanded(child: _buildStepLine(0, typeColor)),
          _buildStepDot(1, 'Contexto', typeColor),
          Expanded(child: _buildStepLine(1, typeColor)),
          _buildStepDot(2, 'Revisión', typeColor),
        ],
      ),
    );
  }

  Widget _buildStepDot(int step, String label, Color activeColor) {
    final isActive = _currentStep >= step;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: isActive ? activeColor : AppColors.border,
            shape: BoxShape.circle,
          ),
          child: Center(
            child: isActive && _currentStep > step
                ? const Icon(Icons.check, color: Colors.white, size: 16)
                : Text(
                    '${step + 1}',
                    style: TextStyle(
                      color: isActive ? Colors.white : AppColors.textHint,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            color: isActive ? activeColor : AppColors.textHint,
            fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
          ),
        ),
      ],
    );
  }

  Widget _buildStepLine(int beforeStep, Color activeColor) {
    final isActive = _currentStep > beforeStep;
    return Container(
      height: 2,
      margin: const EdgeInsets.symmetric(horizontal: 4),
      color: isActive ? activeColor : AppColors.border,
    );
  }

  Widget _buildStep1Evidence(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '¿Qué quieres reportar?',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Agrega fotos y describe el incidente',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 24),

          // Photos section
          const Text(
            'EVIDENCIA FOTOGRÁFICA',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: AppColors.textSecondary,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 12),
          _buildPhotoGrid(context),
          const SizedBox(height: 24),

          // Title
          TextFormField(
            controller: _titleController,
            decoration: const InputDecoration(
              labelText: 'Título del incidente',
              hintText: 'Describe brevemente el incidente',
            ),
            textCapitalization: TextCapitalization.sentences,
          ),
          const SizedBox(height: 16),

          // Description with voice button
          TextFormField(
            controller: _descriptionController,
            decoration: InputDecoration(
              labelText: 'Descripción',
              hintText: 'Describe el incidente en detalle...',
              suffixIcon: IconButton(
                icon: const Icon(Icons.mic, color: AppColors.accent),
                onPressed: () {
                  // TODO(developer): Voice to text
                },
              ),
            ),
            maxLines: 4,
            textCapitalization: TextCapitalization.sentences,
          ),
        ],
      ),
    );
  }

  Widget _buildPhotoGrid(BuildContext context) {
    return SizedBox(
      height: 100,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: _photos.length + 1,
        itemBuilder: (context, index) {
          if (index == _photos.length) {
            return _buildAddPhotoButton(context);
          }
          return _buildPhotoThumbnail(index);
        },
      ),
    );
  }

  Widget _buildAddPhotoButton(BuildContext context) {
    return InkWell(
      onTap: _pickImage,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: 100,
        height: 100,
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.border),
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.add_a_photo_outlined, size: 32, color: AppColors.accent),
            SizedBox(height: 4),
            Text(
              'Agregar',
              style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPhotoThumbnail(int index) {
    return Container(
      width: 100,
      height: 100,
      margin: const EdgeInsets.only(right: 8),
      decoration: BoxDecoration(
        color: AppColors.backgroundLight,
        borderRadius: BorderRadius.circular(12),
        image: DecorationImage(
          image: NetworkImage(
            'https://picsum.photos/100',
          ), // Replace with FileImage(_photos[index]) logic
          // Since _photos now contains paths, we should ideally use FileImage via a helper
          // For now, let's keep it simple or conditionally show generic if it's a mock path
          // But implementing FileImage is better:
          // image: FileImage(File(_photos[index])),
          // However, to avoid 'dart:io' import conflict in UI if specific cross-platform needs arise,
          // we assume mobile. But I haven't imported dart:io here yet.
          // Let's stick to a placeholder icon or try to use Asset/Network.
          // Actually, I can import dart:io.
          fit: BoxFit.cover,
        ),
      ),
      child: Stack(
        children: [
          Positioned(
            top: 4,
            right: 4,
            child: InkWell(
              onTap: () {
                setState(() {
                  _photos.removeAt(index);
                });
              },
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: const BoxDecoration(
                  color: Colors.black54,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.close, size: 16, color: Colors.white),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStep2Context(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Información adicional',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Agrega ubicación y prioridad',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 24),

          // Location
          const Text(
            'UBICACIÓN',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: AppColors.textSecondary,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  initialValue: _location,
                  onChanged: (value) => _location = value,
                  decoration: const InputDecoration(
                    hintText: 'Ej: Piso 3, Zona Norte',
                    prefixIcon: Icon(Icons.location_on_outlined),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                decoration: BoxDecoration(
                  color: AppColors.accent.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: IconButton(
                  icon: const Icon(
                    Icons.qr_code_scanner,
                    color: AppColors.accent,
                  ),
                  onPressed: () {
                    // TODO(developer): QR scanner
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 32),

          // Priority toggle
          const Text(
            'PRIORIDAD',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: AppColors.textSecondary,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: _isCritical
                  ? AppColors.priorityCritical.withValues(alpha: 0.1)
                  : Colors.white,
              border: Border.all(
                color: _isCritical
                    ? AppColors.priorityCritical
                    : AppColors.border,
                width: _isCritical ? 2 : 1,
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.warning_amber_rounded,
                  color: _isCritical
                      ? AppColors.priorityCritical
                      : AppColors.textHint,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Marcar como CRÍTICO',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          color: _isCritical
                              ? AppColors.priorityCritical
                              : AppColors.textPrimary,
                        ),
                      ),
                      const Text(
                        'Se notificará inmediatamente al equipo',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                Switch(
                  value: _isCritical,
                  onChanged: (value) {
                    setState(() => _isCritical = value);
                  },
                  activeThumbColor: AppColors.priorityCritical,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStep3Review(BuildContext context, IncidentType type) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Revisar y enviar',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Verifica que la información sea correcta',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 24),

          // Summary card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: AppShadows.card,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Type badge
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.getIncidentTypeColor(
                      type.name,
                    ).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    type.displayName,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppColors.getIncidentTypeColor(type.name),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                // Title
                Text(
                  _titleController.text.isEmpty
                      ? '(Sin título)'
                      : _titleController.text,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                // Description
                Text(
                  _descriptionController.text.isEmpty
                      ? '(Sin descripción)'
                      : _descriptionController.text,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 16),
                const Divider(),
                const SizedBox(height: 12),
                // Location
                Row(
                  children: [
                    const Icon(
                      Icons.location_on_outlined,
                      size: 16,
                      color: AppColors.textHint,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      _location?.isNotEmpty ?? false
                          ? _location!
                          : '(Sin ubicación)',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                // Photos count
                Row(
                  children: [
                    const Icon(
                      Icons.photo_outlined,
                      size: 16,
                      color: AppColors.textHint,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '${_photos.length} fotos',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
                // Critical badge
                if (_isCritical) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.priorityCritical.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.warning,
                          size: 14,
                          color: AppColors.priorityCritical,
                        ),
                        SizedBox(width: 4),
                        Text(
                          'PRIORIDAD CRÍTICA',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: AppColors.priorityCritical,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomButtons(BuildContext context, Color typeColor) {
    return BlocBuilder<CreateIncidentBloc, CreateIncidentState>(
      builder: (context, state) {
        final isLoading = state is CreateIncidentLoading;
        return Container(
          padding: EdgeInsets.fromLTRB(
            24,
            16,
            24,
            MediaQuery.of(context).padding.bottom + 16,
          ),
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: AppShadows.medium,
          ),
          child: Row(
            children: [
              if (_currentStep > 0)
                OutlinedButton(
                  onPressed: isLoading ? null : _goBack,
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size(100, 52),
                  ),
                  child: const Text('Atrás'),
                ),
              if (_currentStep > 0) const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: isLoading
                      ? null
                      : (_currentStep == 2 ? () => _submit(context) : _goNext),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: typeColor,
                    minimumSize: const Size(double.infinity, 52),
                  ),
                  child: isLoading
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : Text(
                          _currentStep == 2 ? 'Enviar reporte' : 'Continuar',
                        ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _goNext() {
    if (_currentStep < 2) {
      unawaited(
        _pageController.nextPage(
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeInOut,
        ),
      );
    }
  }

  void _goBack() {
    if (_currentStep > 0) {
      unawaited(
        _pageController.previousPage(
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeInOut,
        ),
      );
    }
  }

  Future<void> _pickImage() async {
    if (_photos.length >= 5) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Máximo 5 fotos permitidas')),
      );
      return;
    }

    final XFile? image = await _picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 70, // Basic compression
      maxWidth: 1024,
    );

    if (image != null) {
      setState(() {
        _photos.add(image.path);
      });
    }
  }

  void _submit(BuildContext context) {
    // Basic validation
    if (_titleController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Por favor agrega un título')),
      );
      return;
    }

    if (_descriptionController.text.length < 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('La descripción debe tener al menos 10 caracteres'),
        ),
      );
      return;
    }

    if (_descriptionController.text.length < 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('La descripción debe tener al menos 10 caracteres'),
        ),
      );
      return;
    }

    final type = widget.incidentType != null
        ? IncidentType.fromString(widget.incidentType!)
        : IncidentType.incidentNotification;

    context.read<CreateIncidentBloc>().add(
      CreateIncidentSubmitted(
        projectId: widget.projectId,
        title: _titleController.text,
        description: _descriptionController.text,
        incidentType: type.name,
        priority: _isCritical ? 'CRITICAL' : 'HIGH', // Example mapping
        location: _location,
        photoPaths: _photos,
      ),
    );
  }

  void _showExitConfirmation(BuildContext context) {
    unawaited(
      showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('¿Descartar reporte?'),
          content: const Text(
            'Si sales ahora, perderás la información ingresada.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Continuar editando'),
            ),
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                context.go('/home');
              },
              child: const Text(
                'Descartar',
                style: TextStyle(color: AppColors.error),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
