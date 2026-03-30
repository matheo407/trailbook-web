import { Hike, Stop, Companion, GearItem } from '@/types';
import { formatDate, formatDuration } from './utils';

const difficultyLabel: Record<string, string> = {
  facile: 'Facile',
  moyen: 'Moyen',
  difficile: 'Difficile',
};

const stopTypeLabel: Record<string, string> = {
  repas: 'Repas',
  repos: 'Repos',
  bivouac: 'Bivouac',
  point_de_vue: 'Point de vue',
  autre: 'Autre',
};

const gearCategoryLabel: Record<string, string> = {
  vêtements: 'Vêtements',
  nourriture: 'Nourriture',
  équipement: 'Équipement',
  sécurité: 'Sécurité',
  navigation: 'Navigation',
  médical: 'Médical',
  autre: 'Autre',
};

export function generateHikeMarkdown(
  hike: Hike,
  stops: Stop[],
  companions: Companion[],
  gearItems: GearItem[]
): string {
  const lines: string[] = [];

  lines.push(`# ${hike.name}`);
  lines.push('');

  // Metadata
  lines.push('## Informations générales');
  lines.push('');
  if (hike.date) lines.push(`- **Date :** ${formatDate(hike.date)}`);
  if (hike.region) lines.push(`- **Région :** ${hike.region}`);
  if (hike.distance) lines.push(`- **Distance :** ${hike.distance} km`);
  if (hike.elevation) lines.push(`- **Dénivelé :** ${hike.elevation} m`);
  if (hike.duration) lines.push(`- **Durée :** ${formatDuration(hike.duration)}`);
  if (hike.difficulty) lines.push(`- **Difficulté :** ${difficultyLabel[hike.difficulty] || hike.difficulty}`);
  lines.push(`- **Statut :** ${hike.status === 'faite' ? 'Faite' : 'Planifiée'}`);
  if (hike.rating) lines.push(`- **Note :** ${'⭐'.repeat(hike.rating)} (${hike.rating}/5)`);
  lines.push('');

  // Description
  if (hike.description) {
    lines.push('## Description');
    lines.push('');
    lines.push(hike.description);
    lines.push('');
  }

  // Companions
  const hikeCompanions = companions.filter((c) => hike.companionIds.includes(c.id));
  if (hikeCompanions.length > 0) {
    lines.push('## Compagnons');
    lines.push('');
    hikeCompanions.forEach((c) => lines.push(`- ${c.name}`));
    lines.push('');
  }

  // Gear
  if (hike.gear && hike.gear.length > 0) {
    lines.push('## Matériel');
    lines.push('');

    const categories = Array.from(new Set(
      hike.gear
        .map((g) => gearItems.find((item) => item.id === g.gearId))
        .filter(Boolean)
        .map((item) => item!.category)
    ));

    categories.forEach((category) => {
      lines.push(`### ${gearCategoryLabel[category] || category}`);
      lines.push('');
      hike.gear.forEach((hikeGear) => {
        const item = gearItems.find((g) => g.id === hikeGear.gearId);
        if (item && item.category === category) {
          const checkbox = hikeGear.packed ? '[x]' : '[ ]';
          const weight = item.weight ? ` (${item.weight}g)` : '';
          lines.push(`- ${checkbox} ${item.name}${weight}`);
        }
      });
      lines.push('');
    });
  }

  // Stops
  if (stops.length > 0) {
    lines.push('## Étapes');
    lines.push('');
    const sorted = [...stops].sort((a, b) => a.order - b.order);
    sorted.forEach((stop, index) => {
      lines.push(`### Étape ${index + 1} — ${stop.name}`);
      lines.push('');
      lines.push(`- **Type :** ${stopTypeLabel[stop.type] || stop.type}`);
      if (stop.coordinate) {
        lines.push(`- **Coordonnées :** ${stop.coordinate.lat.toFixed(5)}, ${stop.coordinate.lng.toFixed(5)}`);
      }
      if (stop.notes) lines.push(`- **Notes :** ${stop.notes}`);
      if (stop.type === 'repas' && stop.mealDetails) {
        lines.push('');
        lines.push(`**Menu :** ${stop.mealDetails}`);
      }
      lines.push('');
    });
  }

  // Comments
  if (hike.comments) {
    lines.push('## Commentaires');
    lines.push('');
    lines.push(hike.comments);
    lines.push('');
  }

  lines.push('---');
  lines.push(`*Exporté depuis TrailBook — ${new Date().toLocaleDateString('fr-FR')}*`);

  return lines.join('\n');
}
