import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { PersonaMode, AppSettings } from '../types';
import { getThemeForMode } from '../theme/sciFiThemes';
import { IronManHudOverlay } from '../components/IronManHudOverlay';
import { HolographicButton } from '../components/HolographicButton';
import { DocAnalyzerService, AnalyzedDocument } from '../services/docAnalyzerService';
import { soundFx } from '../audio/soundEngine';
import {
  FolderLock,
  FileText,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  BookOpen,
} from 'lucide-react-native';

interface DocumentVaultProps {
  mode: PersonaMode;
  settings: AppSettings;
}

export const DocumentVaultScreen: React.FC<DocumentVaultProps> = ({ mode, settings }) => {
  const theme = getThemeForMode(mode);
  const [documents, setDocuments] = useState<AnalyzedDocument[]>([]);
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<AnalyzedDocument | null>(null);

  useEffect(() => {
    DocAnalyzerService.getDocuments().then(setDocuments);
  }, []);

  const handleAnalyzeAndSave = async () => {
    if (!docTitle.trim() || !docContent.trim() || isAnalyzing) return;
    setIsAnalyzing(true);
    soundFx.playAlert();

    try {
      const analyzed = await DocAnalyzerService.analyzeDocument(
        docTitle.trim(),
        docContent.trim(),
        mode,
        settings.geminiApiKey
      );
      setDocuments([analyzed, ...documents]);
      setSelectedDoc(analyzed);
      setDocTitle('');
      setDocContent('');
      setIsAdding(false);
      soundFx.playTargetLock();
    } catch (e) {
      console.warn('Doc analysis error:', e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDelete = async (id: string) => {
    soundFx.playHudClick();
    await DocAnalyzerService.deleteDocument(id);
    setDocuments(documents.filter((d) => d.id !== id));
    if (selectedDoc?.id === id) setSelectedDoc(null);
  };

  return (
    <IronManHudOverlay mode={mode}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={[styles.headerCard, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
          <View style={styles.headerIconRow}>
            <FolderLock size={20} color={theme.colors.primary} />
            <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
              DOCUMENT INTELLIGENCE VAULT
            </Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            Neural Indexing, Risk Factor Extraction & Document Summarization
          </Text>
        </View>

        {/* Add Document Toggle */}
        <View style={styles.actionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            INDEXED INTELLIGENCE DOSSIERS ({documents.length}):
          </Text>
          <TouchableOpacity
            onPress={() => setIsAdding(!isAdding)}
            style={[styles.addDocBtn, { borderColor: theme.colors.primary }]}
          >
            <Plus size={12} color={theme.colors.primary} />
            <Text style={[styles.addDocBtnText, { color: theme.colors.primary }]}>
              {isAdding ? 'Cancel' : 'Index Document'}
            </Text>
          </TouchableOpacity>
        </View>

        {isAdding && (
          <View style={[styles.inputCard, { borderColor: theme.colors.primary, backgroundColor: theme.colors.surfaceElevated }]}>
            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
              DOSSIER TITLE / FILENAME:
            </Text>
            <TextInput
              style={[styles.textInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
              placeholder="e.g. 'Project Repulsor Mk 85 Blueprint.md'..."
              placeholderTextColor={theme.colors.textMuted}
              value={docTitle}
              onChangeText={setDocTitle}
            />

            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary, marginTop: 4 }]}>
              PASTE DOCUMENT TEXT OR RESEARCH CONTENT:
            </Text>
            <TextInput
              style={[styles.contentInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
              placeholder="Paste research, meeting notes, code architecture, or articles here..."
              placeholderTextColor={theme.colors.textMuted}
              value={docContent}
              onChangeText={setDocContent}
              multiline
              numberOfLines={4}
            />

            <HolographicButton
              title={isAnalyzing ? 'Analyzing & Indexing...' : 'Analyze & Commit to Vault'}
              mode={mode}
              disabled={isAnalyzing}
              onPress={handleAnalyzeAndSave}
              icon={isAnalyzing ? <ActivityIndicator size="small" color="#FFF" /> : <Sparkles size={14} color="#FFF" />}
            />
          </View>
        )}

        {/* Documents Selector Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.docScrollRow}>
          {documents.map((doc) => {
            const isSel = selectedDoc?.id === doc.id;
            return (
              <TouchableOpacity
                key={doc.id}
                onPress={() => {
                  soundFx.playHudClick();
                  setSelectedDoc(doc);
                }}
                style={[
                  styles.docChip,
                  {
                    borderColor: isSel ? theme.colors.primary : theme.colors.border,
                    backgroundColor: isSel ? 'rgba(0, 240, 255, 0.15)' : theme.colors.surface,
                  },
                ]}
              >
                <FileText size={12} color={isSel ? theme.colors.primary : '#5A6F87'} />
                <Text
                  style={[
                    styles.docChipText,
                    { color: isSel ? theme.colors.primary : theme.colors.textMuted },
                  ]}
                  numberOfLines={1}
                >
                  {doc.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Selected Document Tactical Breakdown */}
        {selectedDoc && (
          <View style={[styles.dossierCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
            <View style={styles.dossierHeader}>
              <View style={styles.dossierTitleRow}>
                <BookOpen size={16} color={theme.colors.primary} />
                <Text style={[styles.dossierTitle, { color: theme.colors.textPrimary }]}>
                  {selectedDoc.title}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(selectedDoc.id)}>
                <Trash2 size={14} color="#5A6F87" />
              </TouchableOpacity>
            </View>

            <Text style={[styles.categoryTag, { color: theme.colors.accent }]}>
              CLASSIFICATION: [{selectedDoc.category}]
            </Text>

            <Text style={[styles.sectionHeading, { color: theme.colors.textSecondary }]}>
              EXECUTIVE SYNOPSIS:
            </Text>
            <Text style={[styles.summaryText, { color: theme.colors.textPrimary }]}>
              {selectedDoc.summary}
            </Text>

            <View style={styles.divider} />

            <Text style={[styles.sectionHeading, { color: theme.colors.textSecondary }]}>
              KEY FINDINGS & SPECIFICATIONS:
            </Text>
            {selectedDoc.keyPoints.map((point, idx) => (
              <View key={idx} style={styles.bulletRow}>
                <CheckCircle size={12} color={theme.colors.success} />
                <Text style={[styles.bulletText, { color: theme.colors.textPrimary }]}>
                  {point}
                </Text>
              </View>
            ))}

            <View style={styles.divider} />

            <Text style={[styles.sectionHeading, { color: theme.colors.textSecondary }]}>
              RISK FACTORS & VULNERABILITIES:
            </Text>
            {selectedDoc.threatsOrRisks.map((risk, idx) => (
              <View key={idx} style={styles.bulletRow}>
                <AlertTriangle size={12} color={theme.colors.warning} />
                <Text style={[styles.bulletText, { color: theme.colors.textPrimary }]}>
                  {risk}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </IronManHudOverlay>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  content: {
    padding: 12,
    gap: 12,
    paddingBottom: 28,
  },
  headerCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  headerIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: 1.2,
  },
  headerSubtitle: {
    fontSize: 9,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  actionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 1.2,
  },
  addDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  addDocBtnText: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  inputCard: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  inputLabel: {
    fontSize: 8,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  textInput: {
    height: 34,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  contentInput: {
    minHeight: 64,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 11,
    fontFamily: 'monospace',
    textAlignVertical: 'top',
  },
  docScrollRow: {
    gap: 6,
  },
  docChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    maxWidth: 200,
  },
  docChipText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  dossierCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  dossierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dossierTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  dossierTitle: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  categoryTag: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  sectionHeading: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'monospace',
    marginTop: 4,
  },
  summaryText: {
    fontSize: 11,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginVertical: 2,
  },
  bulletText: {
    fontSize: 11,
    lineHeight: 15,
    flex: 1,
  },
});
