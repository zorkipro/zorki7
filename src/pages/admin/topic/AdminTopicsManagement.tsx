import React, { useState, useEffect } from "react";
import { Button, Input, Label, Switch, Tabs, TabsContent, TabsList, TabsTrigger, Card, CardContent, CardHeader, CardTitle, Badge, AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/ui-kit";
import { Loader2, Plus, Edit, Trash2, Calendar } from "lucide-react";
import { useAdminTopics } from "@/hooks/admin/useAdminTopics.ts";
import { AdminHeader } from "@/components/admin/AdminHeader.tsx";
import type { TopicsOutputDto } from "@/api/types.ts";
import { toast } from "@/hooks/use-toast.ts";

const INITIAL_FORM_DATA = { name: "", isRestricted: false };

const AdminTopicsManagement = () => {
  const { loading, createTopicAction, updateTopicAction, deleteTopicAction, loadTopics } = useAdminTopics();
  const [topics, setTopics] = useState<TopicsOutputDto[]>([]);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [editingTopic, setEditingTopic] = useState<TopicsOutputDto | null>(null);
  const [deletingTopic, setDeletingTopic] = useState<TopicsOutputDto | null>(null);

  const normalTopics = topics.filter((t) => !t.isRestricted);
  const restrictedTopics = topics.filter((t) => t.isRestricted);

  const loadAllTopics = async () => {
    try {
      const [normalResult, restrictedResult] = await Promise.all([
        loadTopics({ isRestricted: false, size: 50 }),
        loadTopics({ isRestricted: true, size: 50 }),
      ]);
      setTopics([...normalResult.items, ...restrictedResult.items]);
    } catch {
      toast({
        title: "Ошибка загрузки топиков",
        description: "Не удалось загрузить список топиков",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadAllTopics();
  }, []);

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setEditingTopic(null);
  };

  const handleCreateTopic = () => {
    setFormData(INITIAL_FORM_DATA);
    setEditingTopic({ id: 0, name: "", isRestricted: false, createdAt: "" } as TopicsOutputDto);
  };

  const handleEditTopic = (topic: TopicsOutputDto) => {
    setFormData({ name: topic.name, isRestricted: topic.isRestricted });
    setEditingTopic(topic);
  };

  const handleSaveTopic = async () => {
    const trimmedName = formData.name.trim();
    if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 40) {
      toast({
        title: "Ошибка валидации",
        description: "Название топика должно содержать от 2 до 40 символов",
        variant: "destructive",
      });
      return;
    }

    try {
      const topicData = { name: trimmedName, isRestricted: formData.isRestricted };
      if (editingTopic!.id > 0) {
        await updateTopicAction(editingTopic!.id, topicData);
        toast({ title: "Топик обновлен", description: `Топик "${trimmedName}" успешно обновлен` });
      } else {
        await createTopicAction(topicData);
        toast({ title: "Топик создан", description: `Топик "${trimmedName}" успешно создан` });
      }
      resetForm();
      await loadAllTopics();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Произошла неизвестная ошибка";
      toast({
        title: editingTopic!.id > 0 ? "Ошибка обновления топика" : "Ошибка создания топика",
        description: message.includes("already exist") 
          ? `Топик "${trimmedName}" уже существует` 
          : message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteTopic = async () => {
    if (!deletingTopic) return;
    try {
      await deleteTopicAction(deletingTopic.id);
      toast({
        title: "Топик удален",
        description: `Топик "${deletingTopic.name}" успешно удален`,
      });
      setDeletingTopic(null);
      await loadAllTopics();
    } catch (err) {
      toast({
        title: "Ошибка удаления топика",
        description: err instanceof Error ? err.message : "Произошла неизвестная ошибка",
        variant: "destructive",
      });
    }
  };

  const renderTopicsList = (topicsList: TopicsOutputDto[], isRestricted: boolean) => (
    <div className="space-y-4">
      {topicsList.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {isRestricted ? "Запрещенных топиков пока нет" : "Обычных топиков пока нет"}
        </div>
      ) : (
        topicsList.map((topic) => (
          <Card key={topic.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">{topic.name}</h3>
                    <Badge variant={isRestricted ? "destructive" : "default"}>
                      {isRestricted ? "Запрещенный" : "Обычный"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Создан: {new Date(topic.createdAt).toLocaleDateString("ru-RU", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditTopic(topic)} disabled={loading}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDeletingTopic(topic)} disabled={loading}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <AdminHeader />

      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Управление топиками</h1>
          <p className="text-muted-foreground">
            Создание, редактирование и удаление топиков для блогеров
          </p>
        </div>

        {editingTopic !== null && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingTopic.id > 0 ? "Редактировать топик" : "Создать новый топик"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="topic-name">Название топика</Label>
                <Input
                  id="topic-name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Введите название топика (2-40 символов)"
                  maxLength={40}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-restricted"
                  checked={formData.isRestricted}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isRestricted: checked }))}
                />
                <Label htmlFor="is-restricted">Запрещенный топик</Label>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveTopic} disabled={loading || !formData.name.trim()}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingTopic.id > 0 ? "Обновить" : "Создать"}
                </Button>
                <Button variant="outline" onClick={resetForm}>Отмена</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="normal" className="flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="normal">
              Обычные топики ({normalTopics.length})
            </TabsTrigger>
            <TabsTrigger value="restricted">
              Запрещенные топики ({restrictedTopics.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="normal" className="mt-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Обычные топики</h3>
                <Button onClick={handleCreateTopic} disabled={loading}>
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить топик
                </Button>
              </div>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                renderTopicsList(normalTopics, false)
              )}
            </div>
          </TabsContent>

          <TabsContent value="restricted" className="mt-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Запрещенные топики</h3>
                <Button onClick={handleCreateTopic} disabled={loading}>
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить топик
                </Button>
              </div>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                renderTopicsList(restrictedTopics, true)
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog
        open={!!deletingTopic}
        onOpenChange={() => setDeletingTopic(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтвердите удаление</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить топик "{deletingTopic?.name}"? Это
              действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTopic}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminTopicsManagement;

