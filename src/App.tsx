import { Routes, Route, Navigate } from "react-router";
import { AppLayout } from "./components/layout/AppLayout";
import { Toaster } from "@/components/ui/sonner";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NovaComparacao from "./pages/NovaComparacao";
import Resultado from "./pages/Resultado";
import Historico from "./pages/Historico";
import AdminPrompts from "./pages/AdminPrompts";
import AdminUsuarios from "./pages/AdminUsuarios";
import Divergencias from "./pages/Divergencias";
import Notificacoes from "./pages/Notificacoes";
import RevisoesAQL from "./pages/RevisoesAQL";
import Kanban from "./pages/Kanban";
import Preferencias from "./pages/Preferencias";
import NotFound from "./pages/NotFound";
import Termos from "./pages/Termos";
import Privacidade from "./pages/Privacidade";
import { MockModeBanner } from "./components/MockModeBanner";

export default function App() {
  return (
    <>
      <MockModeBanner />
      <Toaster position="top-right" richColors closeButton />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/termos" element={<Termos />} />
        <Route path="/privacidade" element={<Privacidade />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/nova-comparacao" element={<NovaComparacao />} />
          <Route path="/resultado/:id" element={<Resultado />} />
          <Route path="/historico" element={<Historico />} />
          <Route path="/kanban" element={<Kanban />} />
          <Route path="/preferencias" element={<Preferencias />} />
          <Route path="/admin/prompts" element={<AdminPrompts />} />
          <Route path="/admin/usuarios" element={<AdminUsuarios />} />
          <Route path="/notificacoes" element={<Notificacoes />} />
          <Route path="/revisoes-aql" element={<RevisoesAQL />} />
          <Route path="/admin/divergencias" element={<Divergencias />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
