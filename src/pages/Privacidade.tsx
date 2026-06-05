import { Link } from "react-router";
import { ArrowLeft, Shield } from "lucide-react";

export default function Privacidade() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/login" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium mb-6">
          <ArrowLeft className="w-4 h-4" />
          Voltar para o login
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Politica de Privacidade</h1>
          </div>

          <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
            <section>
              <h2 className="font-semibold text-slate-900 mb-2">1. Dados Coletados</h2>
              <p>Coletamos nome, email e dados de uso da plataforma. Documentos enviados para analise sao processados temporariamente e nao armazenamos o conteudo apos a analise.</p>
            </section>

            <section>
              <h2 className="font-semibold text-slate-900 mb-2">2. Uso dos Dados</h2>
              <p>Seus dados sao utilizados para autenticacao, personalizacao da experiencia e melhoria continua dos modelos de IA.</p>
            </section>

            <section>
              <h2 className="font-semibold text-slate-900 mb-2">3. Compartilhamento</h2>
              <p>Nao vendemos nem compartilhamos seus dados pessoais com terceiros, exceto quando exigido por lei.</p>
            </section>

            <section>
              <h2 className="font-semibold text-slate-900 mb-2">4. Seguranca</h2>
              <p>Utilizamos criptografia e praticas de seguranca padrao da industria para proteger suas informacoes.</p>
            </section>

            <section>
              <h2 className="font-semibold text-slate-900 mb-2">5. Seus Direitos</h2>
              <p>Voce pode solicitar acesso, correcao ou exclusao dos seus dados a qualquer momento entrando em contato com o administrador.</p>
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
