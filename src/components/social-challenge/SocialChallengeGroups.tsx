import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

const groups = [
  { id: 1, name: 'Mães Atípicas', emoji: '👩‍👧', slug: 'maes-atipicas' },
  { id: 2, name: 'Pessoas com Deficiência', emoji: '♿', slug: 'pcd' },
  { id: 3, name: 'Motoboys', emoji: '🏍️', slug: 'motoboys' },
  { id: 4, name: 'Taxistas', emoji: '🚕', slug: 'taxistas' },
  { id: 5, name: 'Motoristas de App', emoji: '🚗', slug: 'motoristas-app' },
  { id: 6, name: 'Alunos', emoji: '🎓', slug: 'alunos' },
  { id: 7, name: 'Empreendedores', emoji: '💼', slug: 'empreendedores' },
  { id: 8, name: 'Educadores', emoji: '🏫', slug: 'educadores' },
  { id: 9, name: 'Profissionais da Saúde', emoji: '🩺', slug: 'saude' },
  { id: 10, name: 'Comerciantes', emoji: '🏪', slug: 'comerciantes' },
  { id: 11, name: 'Influenciadores', emoji: '📱', slug: 'influenciadores' },
  { id: 12, name: 'Voluntários', emoji: '🤝', slug: 'voluntarios' },
];

export function SocialChallengeGroups() {
  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        👥 Grupos de Participação
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {groups.map((group) => (
          <Link
            key={group.id}
            to={`/desafio-social/${group.slug}`}
            className="block"
          >
            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 hover:border-primary">
              <CardContent className="p-6 text-center">
                <span
                  className="text-4xl block mb-2"
                  role="img"
                  aria-label={group.name}
                >
                  {group.emoji}
                </span>
                <p className="font-medium text-sm">{group.name}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
