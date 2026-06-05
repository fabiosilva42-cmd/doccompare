import { Link } from "react-router";
import { ArrowLeft, FileText } from "lucide-react";

export default function Termos() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/login" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium mb-6">
          <ArrowLeft className="w-4 h-4" />
          Voltar para o login
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Termos de Uso</h1>
          </div>

          <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
            <section>
              <h2 className="font-semibold text-slate-900 mb-2">1. Aceitacao dos Termos</h2>
              <p>Ao acessar e usar o DocCompare, voce concorda em cumprir estes Termos de Uso e todas as leis e regulamentos aplicaveis.</p>
            </section>

            <section>
              <h2 className="font-semibold text-slate-900 mb-2">2. Uso da Plataforma</h2>
              <p>O DocCompare e uma ferramenta de analise documental assistida por IA. Voce se compromete a usar a plataforma de forma etica e legal, nao utilizando-a para fins fraudulentos ou ilegais.</p>
            </section>

            <section>
              <h2 className="font-semibold text-slate-900 mb-2">3. Propriedade Intelectual</h2>
              <p>Todos os direitos sobre a plataforma, incluindo codigo, design, marcas e conteudo, pertencem aos seus respectivos proprietarios.</p>
            </section>

            <section>
              <h2 className="font-semibold text-slate-900 mb-2">4. Limitacao de Responsabilidade</h2>
              <p>A analise gerada por IA e um auxilio e nao substitui a revisao humana. O usuario e responsavel por validar os resultados antes de tomar decisoes.</p>
            </section>

            <section>
              <h2 className="font-semibold text-slate-900 mb-2">5. Alteracoes</h2>
              <p>Reservamo-nos o direito de modificar estes termos a qualquer momento. Alteracoes significativas serao comunicadas aos usuarios.</p>
            </section>
          </div>

          <p className="mt-8 text-xs text-slate-400 text-center">
            Ultima atualizacao: {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
