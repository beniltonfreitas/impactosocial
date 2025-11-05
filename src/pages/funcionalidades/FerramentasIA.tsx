import { ModuleLayout } from '@/components/funcionalidades/ModuleLayout';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Image, Video, Workflow, BarChart3 } from 'lucide-react';
import { ChatIAModule } from '@/components/ia/ChatIAModule';
import { ImageGeneratorModule } from '@/components/ia/ImageGeneratorModule';
import { VideoGeneratorModule } from '@/components/ia/VideoGeneratorModule';
import { StudioIAModule } from '@/components/ia/StudioIAModule';
import { AnalysesIAModule } from '@/components/ia/AnalysesIAModule';

export default function FerramentasIA() {
  return (
    <PermissionGate permission="ia_tools">
      <ModuleLayout
        title="Ferramentas IA"
        description="Explore o poder da inteligência artificial"
      >
        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="chat">
              <MessageSquare className="mr-2 h-4 w-4" />
              Chat IA
            </TabsTrigger>
            <TabsTrigger value="image">
              <Image className="mr-2 h-4 w-4" />
              Imagens
            </TabsTrigger>
            <TabsTrigger value="video">
              <Video className="mr-2 h-4 w-4" />
              Vídeos
            </TabsTrigger>
            <TabsTrigger value="studio">
              <Workflow className="mr-2 h-4 w-4" />
              Studio
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="mr-2 h-4 w-4" />
              Análises
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat">
            <ChatIAModule />
          </TabsContent>
          <TabsContent value="image">
            <ImageGeneratorModule />
          </TabsContent>
          <TabsContent value="video">
            <VideoGeneratorModule />
          </TabsContent>
          <TabsContent value="studio">
            <StudioIAModule />
          </TabsContent>
          <TabsContent value="analytics">
            <AnalysesIAModule />
          </TabsContent>
        </Tabs>
      </ModuleLayout>
    </PermissionGate>
  );
}
